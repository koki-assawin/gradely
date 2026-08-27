// Helper client function to call the Cloudflare Worker proxy
// PROXY_BASE has been set to the Worker URL deployed in your Cloudflare account

const PROXY_BASE = 'https://dawn-fire-b401.koki-assawin.workers.dev' // <- updated to your deployed Worker URL

/**
 * Fetch plaintext contents of a remotely hosted document (e.g. Google Docs export)
 * via the Cloudflare Worker proxy to avoid CORS failures.
 *
 * @param {string} remoteUrl - The full URL to fetch (already public-export URL)
 * @returns {Promise<string>} - The plaintext body
 */
async function fetchKeyPlaintext(remoteUrl) {
  if (!remoteUrl) throw new Error('Missing remoteUrl')
  try {
    const proxyUrl = `${PROXY_BASE}?url=${encodeURIComponent(remoteUrl)}`
    const res = await fetch(proxyUrl, { method: 'GET', credentials: 'omit' })
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

// Example of usage inside your existing flow:
// const plaintext = await fetchKeyPlaintext('https://docs.google.com/document/d/ID/export?format=txt')
// then parse plaintext to extract API key or doc content as needed
