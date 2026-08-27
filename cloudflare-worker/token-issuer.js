// token-issuer worker
// Requires two Secret bindings in Cloudflare: ADMIN_TOKEN, SIGNING_KEY

addEventListener('fetch', event => event.respondWith(handle(event.request)))

const ADMIN_HEADER = 'x-admin-token'
const DEFAULT_TTL = 60 * 10 // 10 minutes

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

async function handle(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const admin = req.headers.get(ADMIN_HEADER)
  if (!admin || typeof ADMIN_TOKEN === 'undefined' || admin !== ADMIN_TOKEN) {
    return new Response('Forbidden', { status: 403 })
  }

  const url = new URL(req.url)
  const ttl = Math.max(30, Math.min(60*60, Number(url.searchParams.get('ttl') || DEFAULT_TTL))) // clamp 30s..1h
  const now = Math.floor(Date.now() / 1000)
  const payload = { iat: now, exp: now + ttl }

  const payloadJson = JSON.stringify(payload)
  const payloadUtf8 = new TextEncoder().encode(payloadJson)
  const payloadB64 = base64urlEncode(payloadUtf8)

  const sig = await hmacSign(SIGNING_KEY, payloadUtf8)
  const sigB64 = base64urlEncode(sig)

  const token = `${payloadB64}.${sigB64}`

  return new Response(JSON.stringify({ token, exp: payload.exp }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
