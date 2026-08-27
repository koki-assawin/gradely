// proxy-worker (verify signed token)
// Requires Secret binding: SIGNING_KEY
addEventListener('fetch', event => event.respondWith(handle(event.request)))

function base64urlDecodeToUint8(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

function base64urlEncode(buffer) {
  const s = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return s
}

async function hmacSign(keyString, dataUint8) {
  const keyData = new TextEncoder().encode(keyString)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, dataUint8)
  return new Uint8Array(sig)
}

async function verifyToken(token) {
  if (!token || token.indexOf('.') === -1) return false
  const [payloadB64, sigB64] = token.split('.')
  try {
    const payloadBytes = base64urlDecodeToUint8(payloadB64)
    const expectedSig = await hmacSign(SIGNING_KEY, payloadBytes)
    const expectedSigB64 = base64urlEncode(expectedSig)
    if (expectedSigB64 !== sigB64) return false
    const payloadJson = new TextDecoder().decode(payloadBytes)
    const payload = JSON.parse(payloadJson)
    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp < now) return false
    return true
  } catch (e) {
    return false
  }
}

const ALLOWED_ORIGINS = ['https://koki-assawin.github.io']
const ALLOWED_TARGET_HOSTS = ['docs.google.com']
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024

async function handle(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }

  const token = request.headers.get('x-proxy-token')
  if (!(await verifyToken(token))) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders(request) })
  }

  const url = new URL(request.url)
  const target = url.searchParams.get('url')
  if (!target) return new Response('Missing url', { status: 400, headers: corsHeaders(request) })
  if (!/^https?:\/\//i.test(target)) return new Response('Invalid url', { status: 400, headers: corsHeaders(request) })

  let parsed
  try { parsed = new URL(target) } catch (e) { return new Response('Invalid target URL', { status: 400, headers: corsHeaders(request) }) }
  if (!ALLOWED_TARGET_HOSTS.includes(parsed.hostname)) return new Response('Target host not allowed', { status: 403, headers: corsHeaders(request) })

  try {
    const resp = await fetch(target, { method: 'GET', headers: { 'User-Agent': 'GradelyProxy/1.0' } })
    const contentLength = resp.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) return new Response('Response too large', { status: 413, headers: corsHeaders(request) })
    const arrayBuffer = await resp.arrayBuffer()
    const contentType = resp.headers.get('content-type') || 'text/plain; charset=utf-8'
    const headers = Object.assign({ 'Content-Type': contentType }, corsHeaders(request))
    return new Response(arrayBuffer, { status: resp.status, headers })
  } catch (err) {
    return new Response('Fetch failed: ' + err.message, { status: 502, headers: corsHeaders(request) })
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  const allowOrigin = ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-proxy-token',
    'Access-Control-Max-Age': '86400'
  }
}
