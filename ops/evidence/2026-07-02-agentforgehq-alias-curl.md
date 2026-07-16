# AgentForgeHQ Alias Curl Evidence

Date: 2026-07-02

Command:

```bash
curl -sS -I https://agentforgehq.vercel.app
```

Output:

```text
HTTP/2 302
cache-control: no-store, max-age=0
content-type: text/plain
date: Thu, 02 Jul 2026 22:57:39 GMT
location: https://vercel.com/sso-api?url=https%3A%2F%2Fagentforgehq.vercel.app%2F&nonce=49d29ecdef8659ef786c28c8d7de766996f61d783b347a1454baa2880eaeadf8
server: Vercel
set-cookie: _vercel_sso_nonce=919d00847e8198044f38cabd5d45ffcd9e998a28b720e734; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Lax
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-frame-options: DENY
x-vercel-id: cpt1::48cpj-1783033059873-55f482ddf803
```

Interpretation: Vercel alias is assigned but protected by SSO/deployment protection.

