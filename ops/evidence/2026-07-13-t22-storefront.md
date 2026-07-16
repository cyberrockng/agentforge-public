# T2.2 Evidence — Storefront implementation
Date: 2026-07-13

## Scope implemented

- Added a shared runtime tenant catalog in `@agentforge/core`.
- Added a web-local storefront catalog mirror so the existing Vercel project can build `apps/web` in isolation.
- Kept the existing runtime tenants:
  - `forge` — public, `/svc/forge`, `/mcp/forge`, 1 USDT.
  - `launch-kit` — soft-launch, `/svc/launch-kit`, `/mcp/launch-kit`, 1 USDT.
- Replaced the placeholder `/forge` page with a real storefront directory.
- Replaced the placeholder `/a/[slug]` page with static storefront pages generated for:
  - `/a/forge`
  - `/a/launch-kit`
- Added status gating:
  - `public` services expose service endpoint and MCP manifest links.
  - `softlaunch` services are clearly labeled as controlled proof/customer-paid pilots, not fully public promotion.
  - earlier statuses would not expose public call links.
- Updated the home page to link to the storefront and real tenant pages.

## Reality boundaries

- No fake founders, revenue, reviews, ratings, receipts, or anchors were added.
- Storefront data comes from committed tenant metadata only.
- Dashboard, Guild, receipts, ledger, and verifier pages remain gated until their tasks are complete.
- No wallet, listing, payment, or `onchainos` command was run.

## Verification

- `npm test` — PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS.

Build output confirmed storefront routes:

```text
├ ● /a/[slug]
│ ├ /a/forge
│ └ /a/launch-kit
├ ○ /forge
```

## Deployment status

Deployed to Vercel production after user approval.

- Deployment ID: `dpl_4TU8F2mTo83pzuTEkKYLG27btCNq`
- Production URL: `https://web-471a3xytv-cyberrockng-s-projects.vercel.app`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Git commit deployed: `40d6cb1`

Initial remote deploy failed because Vercel builds `apps/web` as an isolated project and could not resolve the workspace import `@agentforge/core`. Fix committed in `40d6cb1`: keep runtime catalog in core, mirror public storefront data inside the web app, and ignore Vercel generated output during lint.

## Live verification

Commands:

```bash
curl -sS -I https://web-one-peach-2vp0hv3dr1.vercel.app/forge
curl -sS https://web-one-peach-2vp0hv3dr1.vercel.app/forge | rg -o "AgentForge storefront|AgentForge|Launch Kit|T2.2 Storefront|Open for paid requests|Controlled soft-launch"
curl -sS -I https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge
curl -sS https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge | rg -o "AgentForge|AI Agent Business Builder|Open for paid requests|View live service endpoint"
curl -sS -I https://web-one-peach-2vp0hv3dr1.vercel.app/a/launch-kit
curl -sS https://web-one-peach-2vp0hv3dr1.vercel.app/a/launch-kit | rg -o "Launch Kit|OKX.AI Launch Kit|Controlled soft-launch|customer-paid pilots"
```

Results:

- `/forge` returned HTTP 200 and rendered `AgentForge storefront`, `Open for paid requests`, `Launch Kit`, and `Controlled soft-launch`.
- `/a/forge` returned HTTP 200 and rendered `AgentForge`, `AI Agent Business Builder`, `Open for paid requests`, and `View live service endpoint`.
- `/a/launch-kit` returned HTTP 200 and rendered `Launch Kit`, `OKX.AI Launch Kit`, `Controlled soft-launch`, and `customer-paid pilots`.
