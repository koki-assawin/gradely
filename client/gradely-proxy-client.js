// Client helper configured to send an authorization token to the proxy

const PROXY_BASE = 'https://dawn-fire-b401.koki-assawin.workers.dev' // Update to your Worker URL
const PROXY_TOKEN = '<PUT-YOUR-PROXY-TOKEN-HERE>' // Replace with the token you configured in Cloudflare

/**
 * Fetch plaintext contents of a remotely hosted document via the Cloudflare Worker proxy
 */
async function fetchKeyPlaintext(remoteUrl) {
  if (!remoteUrl) throw new Error('Missing remoteUrl')
  try {
    const proxyUrl = `${PROXY_BASE}?url=${encodeURIComponent(remoteUrl)}`
    const res = await fetch(proxyUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'x-proxy-token': PROXY_TOKEN
      }
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Proxy error ${res.status}: ${text}`)
    }
    const txt = await res.text()
    return txt
  } catch (err) {
    console.error('fetchKeyPlaintext failed:', err)
    throw err
  }
}
