# T-D Evidence — Launch Kit soft-launch
Date: 2026-07-07

## Recalibrated H2 spending target

Project wallet, copied from `ops/decisions.md#h1-evidence` and the live runtime payment route:

```text
0xfc9b58e81bce27c2f46558d501228d935f93e802
```

Fund on X Layer with USDT only if AgentForge is subsidizing the next proof call.

- Payment integration is already proven by the real 1 USDT First Heartbeat on `/svc/forge`; do not fund just to prove x402 again.
- Preferred spend path: first Launch Kit customer pays their own 1 USDT call.
- If AgentForge needs to subsidize Launch Kit evidence, default cap is 2 USDT total: 1 USDT for the Launch Kit heartbeat and 1 USDT for one retry or seed customer call.
- The previous 5 USDT minimum and 10 USDT recommendation are retired unless the user explicitly approves a larger traction budget.
- If the funding interface asks for gas, add only a tiny OKB amount. OKB is for anchoring/gas needs, not for proving payment integration.

## Scope completed

- Promoted Launch Kit tenant from `gated` to `softlaunch`.
- Expanded Launch Kit from a generic checklist into a real OKX.AI launch-readiness product:
  - listing clarity checks;
  - public endpoint / always-on responder readiness;
  - delisting-recovery plan;
  - proof-bundle requirements;
  - spawned ASP registration package.
- Kept public copy outcome-focused and avoided exposing AgentForge internals.

## ASP registration package prepared

Human submits; Codex does not click through marketplace listing changes.

```text
Agent name: OKX.AI Launch Kit
Category: business
Service title: Launch Readiness Review
Suggested fee: 1 USDT
Endpoint: https://agentforge-runtime-production-9a4d.up.railway.app/svc/launch-kit
MCP manifest: https://agentforge-runtime-production-9a4d.up.railway.app/mcp/launch-kit
```

Short description:

```text
Review-ready launch checks for OKX.AI builders: listing copy, endpoint readiness, delisting recovery, and proof bundles.
```

Service description:

```text
Reviews an OKX.AI ASP launch package for listing clarity, endpoint or responder readiness, delisting risk, and proof gaps. Returns a pass/fix report, repair plan, and evidence checklist.
```

Submitter checklist:

- Confirm the endpoint returns payment-required from a clean session.
- Run one paid heartbeat before submitting the spawned ASP identity.
- Keep public copy outcome-focused and avoid internal AgentForge mechanics.
- Run comm-readiness after create/update if the listing includes any A2A service.
- Save listing ID, endpoint proof, and paid-call receipt in ops evidence.

## Checks

- `npm test` — PASS, core 5 files / 23 tests, runtime 1 file / 7 tests.
- `npm run typecheck` — PASS.
- `npx eslint .` — PASS.
- `npm run build` — PASS.

## Local verification

Local runtime required elevated execution because the default sandbox blocked binding `127.0.0.1:4022`.

- `GET /svc/launch-kit` returned tenant status `softlaunch`.
- Local unpaid `POST /svc/launch-kit` failed closed with `payment_facilitator_not_configured`, expected because real OKX x402 variables live only on Railway.

## Railway deployment

- Service: `agentforge-runtime`.
- URL: `https://agentforge-runtime-production-9a4d.up.railway.app`.
- Deployment ID: `8e0eec50-e94a-48c6-9826-0ef23c7463c9`.
- Status: `SUCCESS`.

Live checks:

- `GET /svc/launch-kit` returned:
  - tenant slug `launch-kit`;
  - status `softlaunch`;
  - price `1 USDT`;
  - payment `x402 exact`;
  - new knowledge facts for delisting recovery and proof bundles.
- `GET /mcp/launch-kit` returned:
  - endpoint `/svc/launch-kit`;
  - status `softlaunch`;
  - output format `Launch-readiness report with pass/fail checks, delisting-recovery steps, and proof-bundle checklist`.
- Unpaid `POST /svc/launch-kit` returned HTTP 402 with:
  - service ID `okxai-launch-kit`;
  - tenant slug `launch-kit`;
  - amount `1000000`;
  - payTo `0xfc9b58e81bce27c2f46558d501228d935f93e802`;
  - display amount `1 USDT`.

## Remaining T-D acceptance items

2026-07-14 update:

- Real paid heartbeat to `/svc/launch-kit`: DONE by `ops/evidence/2026-07-14-launch-kit-heartbeat.md`.
- First paid proof call logged: DONE as `sc_launch-kit_3b103d9976a5`.
- Independent customer-paid call: not done; current proof is self-operated by AgentForge.

Still not done:

- Launch Kit ASP click-through submission.

Funding note:

- H2 funded the self-operated Launch Kit paid proof at `0.45 USDT`. Future external customer calls should be customer-paid by default.
