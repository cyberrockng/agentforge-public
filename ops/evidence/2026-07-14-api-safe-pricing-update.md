# API-Safe Pricing Update

Date: 2026-07-14

## Scope

User approved overwriting the previous cost-controlled launch prices to better protect API/model cost.

New active prices:

- Forge: `0.40 USDT`
- ShieldCheck: `0.40 USDT` while gated/non-public-callable
- Launch Kit: `0.45 USDT`

Superseded prices:

- Forge: `0.15 USDT`
- ShieldCheck: `0.15 USDT`
- Launch Kit: `0.25 USDT`

## Repo changes

- Runtime tenant catalog now quotes Forge at `$0.40` and Launch Kit at `$0.45`.
- ShieldCheck display price is now `0.40 USDT`, but ShieldCheck remains gated/non-public-callable.
- Web storefront catalog now displays `0.40 USDT` / `0.40 USDT` / `0.45 USDT`.
- Launch Kit generated registration package now suggests `0.45 USDT`.

## Required production follow-up

- Railway runtime deployed:
  - Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
  - Deployment ID: `b5e49ee9-2a9d-481a-a574-43a261674428`
- Vercel web deployed:
  - Production deployment: `https://web-ajjs3yec3-cyberrockng-s-projects.vercel.app`
  - Stable production alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
  - Deployment ID: `dpl_2SNMa45tBJUwHD2a3EC8mnxx2a6W`
- OKX.AI AgentForge listing `#3746` existing `AI Agent Business Builder` service fee updated from `0.15` USDT to `0.40` USDT.
  - Update transaction: `0xd2fc4f025cb27f8f3969edb83328864e51f89c37bdb45183e15d6e28766b0ef9`
  - Service ID after update: `33800`
  - Post-update communication refresh/setup completed.
- Runtime, web, and OKX listing were live-verified after update.

## Live verification

Runtime service contracts:

- `GET /svc/forge` returned `price: "0.40 USDT"` and `status: "public"`.
- `GET /svc/launch-kit` returned `price: "0.45 USDT"` and `status: "softlaunch"`.

Runtime x402 unpaid challenges:

- `POST /svc/forge` with a valid body returned HTTP `402`, x402 `amount: "400000"`, `displayAmount: "0.40 USDT"`.
- `POST /svc/launch-kit` with a valid body returned HTTP `402`, x402 `amount: "450000"`, `displayAmount: "0.45 USDT"`.

Web production pages:

- `/` contained `0.40 USDT` and `0.45 USDT`.
- `/a/forge` contained `0.40 USDT`.
- `/a/shieldcheck` contained `0.40 USDT`.
- `/a/launch-kit` contained `0.45 USDT`.
- `/guild` contained `0.40 USDT`.

OKX listing:

- AgentForge `#3746` service `AI Agent Business Builder` returned fee `0.40 USDT`.

## Boundaries

- Historical 1 USDT payment proofs and receipts are not rewritten.
- No customer payment call is part of the pricing update.
- No wallet transfer or project subsidy is part of the pricing update.
- ShieldCheck status remains gated until its Forge Gate report passes.
