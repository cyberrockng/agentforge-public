# Blue Brand Web Redeploy Curl Evidence

Date: 2026-07-03

Deployment ID: `dpl_5GLzHLAkvy8Bi8yaqHJzKEGAmuQP`

## Root

Command:

```bash
curl -sS -I https://web-one-peach-2vp0hv3dr1.vercel.app
```

Output:

```text
HTTP/2 200
accept-ranges: bytes
access-control-allow-origin: *
age: 0
cache-control: public, max-age=0, must-revalidate
content-disposition: inline
content-type: text/html; charset=utf-8
date: Fri, 03 Jul 2026 21:14:39 GMT
etag: "0a8e8405ca9f402c088b4edb7afdcfd6"
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
x-matched-path: /
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-vercel-cache: PRERENDER
x-vercel-id: cpt1::slp42-1783113278804-42a100a954ce
content-length: 12982
```

## Admin

Command:

```bash
curl -sS -I https://web-one-peach-2vp0hv3dr1.vercel.app/admin
```

Output:

```text
HTTP/2 404
accept-ranges: bytes
access-control-allow-origin: *
age: 0
cache-control: public, max-age=0, must-revalidate
content-disposition: inline
content-type: text/html; charset=utf-8
date: Fri, 03 Jul 2026 21:14:41 GMT
etag: "4620d6b4717b9bcf2b7ebb903ac4fff7"
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
x-matched-path: /admin
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-vercel-cache: PRERENDER
x-vercel-id: cpt1::98nmg-1783113280269-e71e9b22bc82
content-length: 4977
```

