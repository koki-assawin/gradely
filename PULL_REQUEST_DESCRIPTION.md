Add token-based auth to Cloudflare Worker and update client to send token

This branch adds a simple token check to the Worker. The Worker expects a Secret Text binding named `PROXY_TOKEN` to be configured in Cloudflare. The client must send the header `x-proxy-token` with the token value.

Files added/updated:
- cloudflare-worker/proxy-worker.js (token auth + host whitelist + CORS headers updated)
- client/gradely-proxy-client.js (sends x-proxy-token header)
- docs/PROXY_SETUP.md updated with steps to add Secret in Cloudflare

Testing steps (web-only):
1. Merge this branch into main
2. In Cloudflare dashboard, for the Worker service, add a binding (Secret text) named `PROXY_TOKEN` and set its value to a random secret string (e.g. generated via a password manager)
3. Deploy the Worker with the updated code
4. Set PROXY_TOKEN in client/gradely-proxy-client.js (or serve the token from a secure server if possible). Then call the proxy:
   https://<your-worker>.workers.dev/?url=<ENCODED_GOOGLE_EXPORT_URL>

Note: Storing the token in client-side code is insecure; for production, provide the token via a secure backend or short-lived tokens.
