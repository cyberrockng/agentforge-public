# 2026-07-16 Next/PostCSS Audit Fix

## Finding

`npm audit --omit=dev` previously reported two moderate vulnerabilities:

- `postcss <8.5.10`
- Nested path: `node_modules/next/node_modules/postcss`
- Advisory: `GHSA-qx2v-qp2m-jg93`

The stable `next@16.2.10` release pinned `postcss@8.4.31`.

## Resolution

Upgraded the web app from `next@^16.2.10` to `next@^16.3.0-preview.6`.

Evidence from the lockfile after install:

- `next: 16.3.0-preview.6`
- `next/node_modules/postcss: 8.5.10`

An npm override was tested first and removed because it did not change the nested Next dependency tree.

## Verification

- `npm audit --omit=dev` -> `found 0 vulnerabilities`
- `npm run test --workspace @agentforge/web` passed: 8 files, 34 tests.
- `npm run build --workspace @agentforge/web` passed.
- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Production Deployment

- Vercel deployment: `dpl_CpuzqEtZbmcYoHmm4agzB24MsEV8`
- Deployment URL: `https://web-5ekist5au-cyberrockng-s-projects.vercel.app`
- Production alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Vercel install step reported `found 0 vulnerabilities`.
- Vercel detected Next.js `16.3.0-preview.6`.

Live smoke checks:

- `GET /` returned 200.
- `GET /a/forge` returned 200.
- `GET /judges` returned 200.
- `/a/forge` HTML contained AgentForge and x402/USDT content.

## Risk Note

`16.3.0-preview.6` is not the `latest` dist-tag. It was chosen because `latest` still pins vulnerable PostCSS, while npm's forced audit fix would downgrade to `next@9.3.3`, which is not safe for this app.
