# Admin Route Curl Evidence

Date: 2026-07-03

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
date: Fri, 03 Jul 2026 18:14:42 GMT
etag: "c6d180bc754be4c50295dc632a55a987"
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
x-matched-path: /admin
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-vercel-cache: PRERENDER
x-vercel-id: cpt1::shj4c-1783102482041-a50e68a197ca
content-length: 4977
```

Interpretation: public `/admin` is not exposed in T0.2.

