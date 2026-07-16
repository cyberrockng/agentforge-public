# Cost-Controlled Pricing Deploy

Date: 2026-07-14

## Scope

User approved deploying the cost-controlled service fees:

- Forge: `0.15 USDT`
- ShieldCheck: `0.15 USDT` while gated/non-public-callable
- Launch Kit: `0.25 USDT`

At deployment time, no OKX.AI marketplace listing update, wallet command, payment command, or on-chain command was run.

Follow-up: the OKX.AI listing fee was aligned later on 2026-07-14 after separate user confirmation. See `ops/evidence/2026-07-14-okx-listing-price-update.md`.

Superseded follow-up: this `0.15` / `0.15` / `0.25` price set was superseded later on 2026-07-14 by API-safe pricing. See `ops/evidence/2026-07-14-api-safe-pricing-update.md`.

## Source

- Commit pushed: `b960c0c [pricing] set cost-controlled launch fees`
- Branch: `main`
- Remote: `origin/main`

## Railway production deploy

- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Deployment ID: `ed2fa684-6d31-477f-9c26-6004824db5a7`
- Status after deploy: online
- Volume remained mounted at `/data`

## Vercel production deploy

- Production deployment: `https://web-ptghs2p6r-cyberrockng-s-projects.vercel.app`
- Stable production alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Deployment ID: `dpl_2t2kCBWTdoSkCXG7tg2EhBZfVBpA`
- Ready state: `READY`

## Live verification

Runtime service contracts:

- `GET /svc/forge` returned `price: "0.15 USDT"` and `status: "public"`.
- `GET /svc/launch-kit` returned `price: "0.25 USDT"` and `status: "softlaunch"`.

Runtime x402 unpaid challenges:

- `POST /svc/forge` with a valid body returned HTTP `402`, x402 `amount: "150000"`, `displayAmount: "0.15 USDT"`.
- `POST /svc/launch-kit` with a valid body returned HTTP `402`, x402 `amount: "250000"`, `displayAmount: "0.25 USDT"`.

Web production pages:

- `/` contained `0.15 USDT` and `0.25 USDT`.
- `/forge` contained `0.15 USDT` and `0.25 USDT`.
- `/a/forge` contained `0.15 USDT`.
- `/a/launch-kit` contained `0.25 USDT`.
- `/guild` contained `0.15 USDT`.

ShieldCheck remains gated, so it is displayed but not public-callable.
