Title: Add Cloudflare Worker proxy and client helper (production settings)

This pull request merges the cloudflare proxy and client helper into the main branch with production-safe defaults.

What this PR does:
- Adds a Cloudflare Worker script that acts as a CORS-safe proxy for fetching remote resources (e.g., Google Docs export links).
  - Restricts Access-Control-Allow-Origin to the production origin (koki-assawin.github.io) to avoid open-proxy behavior.
  - Applies a 5 MB response size limit and basic URL validation.
- Adds a client helper (fetchKeyPlaintext) configured to call the deployed Worker URL.
- Includes documentation (PROXY_SETUP.md) with steps to deploy and test the Worker.

Files changed:
- cloudflare-worker/proxy-worker.js (new/updated)
- client/gradely-proxy-client.js (new/updated)
- docs/PROXY_SETUP.md (new/updated)

Testing steps:
1. Deploy the Worker via Cloudflare Dashboard or wrangler.
2. Ensure the Worker URL is set as PROXY_BASE in client/gradely-proxy-client.js.
3. Make a test request to:
   <worker_url>?url=<encoded_google_export_url>
   Expect: 200 response and Access-Control-Allow-Origin header set to https://koki-assawin.github.io

Risks & mitigations:
- Still allows arbitrary HTTP(S) targets by default. If you need stricter restrictions, consider adding a target-host whitelist or a token-check. The current setup protects origin exposure but not target abuse.

Author: koki-assawin

