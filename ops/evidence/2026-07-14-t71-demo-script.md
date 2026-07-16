# T7.1 Demo script + rehearsal package · 2026-07-14

Status: DONE for the builder-owned demo package. H5/T7.2 filming remains human-owned and not performed by Codex.

## Scope

T7.1 prepares the M2 demo path after the G2 fallback ruling:

- live ≤90 second demo script;
- route-by-route click path;
- truthful claims map;
- rehearsal scorecard for five live rehearsals and three filmed takes;
- handoff checklist for H5 filming, H6 X post, and H7 Google form.

No X/Twitter post, Google form submission, OKX listing edit, wallet action, payment, contract transaction, or `onchainos` command was run.

## Live surfaces checked

Checked on 2026-07-14 against production:

- `https://web-one-peach-2vp0hv3dr1.vercel.app/guild` — HTTP `200`.
- `https://web-one-peach-2vp0hv3dr1.vercel.app/dashboard` — HTTP `200`.
- `https://web-one-peach-2vp0hv3dr1.vercel.app/launch-engine` — HTTP `200`.
- `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/psr_forge_b8f8787c7c13` — HTTP `200`.
- `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/psr_shieldcheck_642e7372000a` — HTTP `200`.
- `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/psr_launch-kit_3b103d9976a5` — HTTP `200`.
- `https://agentforge-runtime-production-9a4d.up.railway.app/ledger/summary` — HTTP `200`, with `paidCalls: 3`.

Runtime ledger numbers at check time:

- Total settled: `1.850000 USDT`.
- Forge revenue: `1.530000 USDT`.
- Founder payable: `0.320000 USDT`.
- AgentForge `/svc/forge`: `1` paid call, `1.000000 USDT`.
- ShieldCheck: `1` paid heartbeat, `0.400000 USDT`, controlled soft-launch.
- Launch Kit: `1` self-operated paid heartbeat, `0.450000 USDT`, heartbeat-stage / soft-launch transition pending.

## Truth constraints for the demo

Allowed claims:

- AgentForge has a real OKX.AI listing record for #3746 and a live public web/runtime surface.
- AgentForge has three real paid proof calls recorded in the live ledger.
- AgentForge has a double-entry ledger and verifier pages for proof-of-service receipts.
- ShieldCheck is Founder #1, has a live gate PASS, its own real paid heartbeat, a birth certificate, and an anchored receipt.
- Launch Kit has a live gate PASS and a real paid self-operated heartbeat.
- The X Launch Engine prepares founder-editable drafts from real proof links only.

Required caveats:

- Do not claim founders #2-#5 are recruited.
- Do not claim G2 passed; it failed and fallback is active.
- Do not claim external customer traction. Current external-founder count is `0`.
- Do not claim Launch Kit is fully public-callable; it is heartbeat-stage / soft-launch transition pending.
- Do not claim Launch Kit's receipt is anchored; it is still `Anchor pending`.
- Do not claim cross-test reviews; verified review count is `0`.
- Do not claim guaranteed OKX approval, guaranteed revenue, guaranteed safety, wallet custody, or automatic listing control.
- Do not claim AgentForge fully deploys and manages every tenant automatically today.

## Live demo click path

Open these tabs before recording, then reload each tab during the take:

1. `/guild` — show only evidence-backed agents and caveats.
2. `/dashboard` — show live ledger totals: 3 paid calls, 1.850000 USDT settled, 0.320000 USDT founder payable.
3. `/verify/psr_shieldcheck_642e7372000a` — show a real ShieldCheck receipt and X Layer anchor.
4. `/verify/psr_launch-kit_3b103d9976a5` — show Launch Kit's paid proof and `Anchor pending` caveat.
5. `/launch-engine` — show human-editable #OKXAI launch draft built from real proof links.

Before H5 filming, manually confirm AgentForge #3746 is still visible/searchable on OKX.AI. If not visible during the take, say: "AgentForge has an approved listing record, and we are verifying marketplace visibility before submission."

## ≤90 second narration script

Target length: about 85-90 seconds at a calm speaking pace.

0-10s — `/guild`

> "This is AgentForge: an OKX.AI business builder for turning an agent idea into a paid service with proof. The Guild only shows proof-backed entries — no demo agents and no invented founders."

10-28s — `/dashboard`

> "The live ledger is the center of the story. It shows three real paid proof calls settled on X Layer: 1.85 USDT total, 1.53 USDT Forge revenue, and 0.32 USDT founder payable."

28-45s — `/verify/psr_shieldcheck_642e7372000a`

> "ShieldCheck is Founder #1. It passed the live Forge Gate, completed its own 0.40 USDT paid heartbeat, and this receipt is anchored on X Layer, so a judge can verify the proof chain."

45-60s — `/verify/psr_launch-kit_3b103d9976a5`

> "Launch Kit is the honest self-operated case. It has a real 0.45 USDT paid heartbeat, but its receipt is still anchor-pending and the service remains heartbeat-stage, not fully public."

60-78s — `/launch-engine`

> "The launch engine turns only these real proof links into founder-editable #OKXAI launch copy. It does not publish automatically and it blocks review or traction claims we do not have."

78-90s — close on `/guild` or `/dashboard`

> "So the M2 claim is narrow and real: AgentForge already has the paid loop — gate, payment, ledger, receipt, verifier, and launch copy — and the remaining work is more founders, not fake traction."

## Rehearsal scorecard

Use five live rehearsals before H5 filming. Each rehearsal must reload the live URLs, not play a pre-rendered walkthrough.

| Run | Duration | All pages live? | Numbers correct? | Caveats spoken? | Notes |
|---|---:|---|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |
| 5 |  |  |  |  |  |

Film at least three live takes after the five rehearsals. Pick the cleanest take where:

- the full recording is ≤90 seconds;
- no hidden/internal docs are shown;
- the ledger totals are visible and match production;
- the ShieldCheck anchored receipt is visible;
- Launch Kit's `Anchor pending` / heartbeat-stage caveat is visible;
- no external-founder/customer/review claim is made.

## Handoff

Immediate next task: H5/T7.2 live demo filming.

After H5/T7.2:

1. Record the final demo URL in `ops/evidence/`.
2. Proceed to T7.3/H6: publish the human-approved X post with `#OKXAI`.
3. Proceed to T7.4/H7: submit the Google form.
4. Run AUDIT-7 before or immediately after M2 submission, depending on timing pressure.
