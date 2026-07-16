# Launch Kit paid heartbeat

Date: 2026-07-14

## Result

Launch Kit completed one real paid proof call on the live production runtime.

- Service: `POST /svc/launch-kit`
- Service title: `OKX.AI Launch Kit`
- Amount: `0.45 USDT`
- Network: `eip155:196`
- Payment tx: `0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a`
- Payer: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- Runtime status: HTTP `200`, `status: delivered`
- Deliverable verdict: `ready-with-caveats`
- Delivered at: `2026-07-14T10:06:36.493Z`

## Ledger

Runtime `/ledger/summary` after the heartbeat:

- Paid calls: `3`
- Settled total: `1.850000 USDT`
- Forge revenue: `1.530000 USDT`
- Founder payable: `0.320000 USDT`

Launch Kit row:

- Paid calls: `1`
- Settled: `0.450000 USDT`
- Forge revenue: `0.450000 USDT`
- Founder payable: `0.000000 USDT`
- ServiceCall ID: `sc_launch-kit_3b103d9976a5`
- Ledger transaction ID: `lt_launch-kit_3b103d9976a5`

## Receipt

- Receipt ID: `psr_launch-kit_3b103d9976a5`
- Receipt JSON: `ops/evidence/2026-07-14-launch-kit-heartbeat-receipt.json`
- Prepared anchor ID: `0xb4cd48ad852b8a66793313bd90915fc281048ca4fad673def1f7d7842172adf9`
- Subject hash: `0xad314e3d7dde19707789f1ad3b774b819d620e9ffd7fa03572cf3eaeb279ed1d`
- Evidence hash: `0x7ed35b38adf365a0d744515dcdd628fb053249f498e6e244396f66218d1c2ef2`
- Metadata hash: `0x8576930c4cda070b9e915a1f3ec55849f11d3018753d469f1e8941b1c8685b39`

No X Layer anchor was broadcast in this step. The public verifier must disclose the Launch Kit receipt anchor as pending unless the user separately approves anchoring.

## Input used

The proof call used a real Launch Kit readiness request for AgentForge's own Launch Kit tenant:

- Project name: `AgentForge Launch Kit`
- Listing status: `softlaunch tenant; public storefront and runtime live; Launch Kit not yet proof-backed`
- Endpoint path: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/launch-kit with x402 exact payment enabled at 0.45 USDT`
- Blocker: `Need one real paid proof before counting Launch Kit as proof-backed in Guild and before moving to T5.`

Proof assets supplied:

- AgentForge listing is live as `#3746`.
- Storefront is live at `https://web-one-peach-2vp0hv3dr1.vercel.app/a/launch-kit`.
- Runtime is live at `https://agentforge-runtime-production-9a4d.up.railway.app/svc/launch-kit`.
- Unpaid clean-session request returns payment-required.
- ShieldCheck and AgentForge receipts are already ledger-backed and verifiable.

## Deliverable

Launch Kit returned `ready-with-caveats`.

All five readiness checks passed:

- Service reality match.
- Public delivery path.
- Payment/readiness signal.
- Feedback captured.
- Proof bundle started.

The returned ASP registration package keeps the suggested fee at `0.45 USDT`.

## Boundary

- This proves Launch Kit can receive and deliver one real paid non-QA service call.
- This is self-operated by AgentForge; it is not an external founder or independent customer win.
- This does not guarantee OKX approval, revenue, reviews, or full public launch.
- No OKX listing update or OKX identity command was run.
- No on-chain anchor broadcast was run for this receipt.

## Deployments and live verification

- Railway deployment: `003eff7e-93d8-4dbf-9fb4-518a0a68cb11`
- Vercel deployment: `dpl_FtfLHMmgADYxuBnpnGjUy1EYG2Xf`
- Stable web alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Verified at: `2026-07-14T10:16:57Z`

Live checks:

- Runtime `/ledger/summary`: HTTP `200`; contains `paidCalls: 3`, `sc_launch-kit_3b103d9976a5`, `Paid heartbeat complete; self-operated soft-launch`, and `settledAtomic: 1850000`.
- `/verify/psr_launch-kit_3b103d9976a5`: HTTP `200`; contains the Launch Kit receipt, payment tx, `self-operated proof call`, and `Anchor pending`.
- `/verify/0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a`: HTTP `200`; resolves to the Launch Kit receipt.
- `/guild`: HTTP `200`; includes Launch Kit as `Self-operated AgentForge proof tenant` and links `psr_launch-kit_3b103d9976a5`.
- `/dashboard`: HTTP `200`; shows Launch Kit `0.450000 USDT` and `Paid heartbeat complete; self-operated soft-launch`.
- `/a/launch-kit`: HTTP `200`; shows Launch Kit and `0.45 USDT`.
