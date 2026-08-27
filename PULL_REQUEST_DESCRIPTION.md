Signed-token proxy: PR description

This branch adds a token issuer worker and a proxy worker that validates signed short-lived tokens.

Files added:
- cloudflare-worker/token-issuer.js  (issuer that returns signed short-lived tokens; requires ADMIN_TOKEN & SIGNING_KEY bindings)
- cloudflare-worker/proxy-worker-signed.js (proxy that verifies token signature & expiry; requires SIGNING_KEY binding)
- client/gradely-proxy-client-signed.js (example client that requests token from issuer and calls proxy)

Setup steps (web-only):
1. Create two Workers in Cloudflare Dashboard:
   - token-issuer (paste token-issuer.js)
   - proxy-worker (paste proxy-worker-signed.js) or update existing worker with this code
2. Set Secret bindings for both workers:
   - SIGNING_KEY: (random hex string) - must be the same for issuer & proxy
   - ADMIN_TOKEN: (random hex string) - set only on issuer
3. Deploy both workers (click Deploy)
4. Request a token (safe action):
   - curl -X POST -H "x-admin-token: <ADMIN_TOKEN>" "https://token-issuer.<...>.workers.dev/token?ttl=600"
   - use returned token in client header x-proxy-token when calling proxy

Testing:
- Make Google Doc public and use export URL. Encode with encodeURIComponent. Call proxy with x-proxy-token header set.

Security notes:
- Do NOT call the issuer from client-side in production with ADMIN_TOKEN. Instead, create a secure backend that authenticates the user and requests a token from issuer.
