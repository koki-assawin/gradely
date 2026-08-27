// token-issuer worker
// Requires two Secret bindings in Cloudflare: ADMIN_TOKEN, SIGNING_KEY

addEventListener('fetch', event => event.respondWith(handle(event.request)))

const ADMIN_HEADER = 'x-admin-token'
const DEFAULT_TTL = 60 * 10 // 10 minutes
const MIN_TTL = 30
const MAX_TTL = 60 * 60 // 1 hour

function base64urlEncode(input) {
  // input: Uint8Array or string
  let bytes;
  if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new TextEncoder().encode(String(input));
  }

  // Convert to binary string in chunks to avoid apply(...) limits
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, slice);
  }

  // btoa on binary string then url-safe replace
  const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
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
  const ttlParam = url.searchParams.get('ttl')
  let ttl
  if (ttlParam === null) {
    ttl = DEFAULT_TTL
  } else {
    const parsed = Number(ttlParam)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return new Response('Invalid ttl', { status: 400 })
    }
    // clamp
    ttl = Math.round(Math.max(MIN_TTL, Math.min(MAX_TTL, parsed)))
  }

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
