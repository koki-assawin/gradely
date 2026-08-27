// Client helper that requests a short-lived token from a secure backend and uses it to call the proxy.
// NOTE: For demo/testing without a backend you can request the token from the token-issuer using an ADMIN_TOKEN

const PROXY_BASE = 'https://dawn-fire-b401.koki-assawin.workers.dev' // update after deploy
const ISSUER_URL = 'https://token-issuer.dawn-fire-b401.koki-assawin.workers.dev' // update after deploy

// Example: request token from issuer (requires ADMIN_TOKEN header) - not for client-side in production
async function requestShortLivedToken(adminToken, ttl = 600) {
  const res = await fetch(`${ISSUER_URL}/token?ttl=${ttl}`, {
    method: 'POST',
    headers: { 'x-admin-token': adminToken }
  })
  if (!res.ok) throw new Error('Failed to get token: ' + res.status)
  const body = await res.json()
  return body.token
}

async function fetchKeyPlaintextWithIssuer(remoteUrl, token) {
  const proxyUrl = `${PROXY_BASE}?url=${encodeURIComponent(remoteUrl)}`
  const res = await fetch(proxyUrl, { method: 'GET', credentials: 'omit', headers: { 'x-proxy-token': token } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Proxy error ${res.status}: ${text}`)
  }
  return await res.text()
}
