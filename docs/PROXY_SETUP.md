# Proxy setup and deploy (whitelist edition)

This document describes how to deploy the Cloudflare Worker proxy and test it. This branch configures the worker to only fetch from a small whitelist of hosts (docs.google.com) to reduce abuse risk.

Steps to deploy (web-only on Chromebook):

1. Merge the branch `feature/proxy-whitelist` into `main` on GitHub
   - Go to your repo: https://github.com/koki-assawin/gradely
   - Switch branch to `feature/proxy-whitelist` then click **Compare & pull request** → **Create pull request** → **Merge pull request**

2. Deploy the Worker via Cloudflare Dashboard (no CLI required)
   - Open Cloudflare Dashboard → Compute → Workers & Pages → select your service (e.g. `gradely` or the worker `dawn-fire-b401`)
   - Open the Worker editor (the one with preview + console). Replace the code with the contents of `cloudflare-worker/proxy-worker.js` from this branch (copy from GitHub).
   - Click **Deploy** (top-right)

3. Test with a public Google Doc
   - Make a Google Doc public: **File → Share → Anyone with the link → Viewer**
   - Export URL pattern: `https://docs.google.com/document/d/<DOC_ID>/export?format=txt`
   - URL-encode the export URL (open browser Console and run `encodeURIComponent('<export_url>')`)
   - In Cloudflare preview, paste: `https://<your-worker>.workers.dev/?url=<ENCODED_URL>` and press refresh

4. Client-side update (if needed)
   - The client helper `client/gradely-proxy-client.js` in this branch points to an example worker host. After you deploy, ensure `PROXY_BASE` is set to the actual worker URL (edit the file on GitHub or in your site code)

5. Verify CORS header
   - Use `curl -i -H "Origin: https://koki-assawin.github.io" "https://<your-worker>.workers.dev/?url=<ENCODED_URL>"`
   - Confirm `Access-Control-Allow-Origin: https://koki-assawin.github.io` in the response headers

Notes
- This whitelist approach avoids storing shared tokens in client-side code and is the easiest to deploy via web UI.
- If you later require stricter protection, we can add token-based auth or rate-limiting (requires setting secrets or Cloudflare KV)
