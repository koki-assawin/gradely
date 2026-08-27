addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

// Simple CORS-safe proxy for fetching remote resources (e.g., Google Docs export URLs)
// This version adds a target-host whitelist so the Worker only fetches from allowed hosts.

const ALLOWED_ORIGINS = ['https://koki-assawin.github.io'] // production origin (no path)
const ALLOWED_TARGET_HOSTS = ['docs.google.com'] // only allow fetching from these hosts
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024 // 5 MB limit to avoid huge payloads

async function handle(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }

  const url = new URL(request.url)
  const target = url.searchParams.get('url')
  if (!target) return new Response('Missing url', { status: 400, headers: corsHeaders(request) })

  // Basic validation: only allow http(s) targets
  if (!/^https?:\/\//i.test(target)) {
    return new Response('Invalid url', { status: 400, headers: corsHeaders(request) })
  }

  // Check target host whitelist
  let parsedTarget
  try {
    parsedTarget = new URL(target)
  } catch (err) {
    return new Response('Invalid target URL', { status: 400, headers: corsHeaders(request) })
  }
  if (!ALLOWED_TARGET_HOSTS.includes(parsedTarget.hostname)) {
    return new Response('Target host not allowed', { status: 403, headers: corsHeaders(request) })
  }

  try {
    const resp = await fetch(target, {
      method: 'GET',
      headers: {
        // optional: forward some headers; avoid forwarding credentials
        'User-Agent': 'GradelyProxy/1.0'
      }
    })

    // Defensive size limit
    const contentLength = resp.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      return new Response('Response too large', { status: 413, headers: corsHeaders(request) })
    }

    const arrayBuffer = await resp.arrayBuffer()
    const contentType = resp.headers.get('content-type') || 'text/plain; charset=utf-8'

    const responseHeaders = Object.assign({ 'Content-Type': contentType }, corsHeaders(request))

    return new Response(arrayBuffer, { status: resp.status, headers: responseHeaders })
  } catch (err) {
    return new Response('Fetch failed: ' + err.message, { status: 502, headers: corsHeaders(request) })
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  const allowOrigin = ALLOWED_ORIGINS.includes('*')
    ? '*'
    : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  }
}
