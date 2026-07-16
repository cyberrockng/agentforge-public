# Controlled Buyer Proof #2 · PolicyPool accuracy regression · 2026-07-14

Status: DONE-LIVE

## Purpose

Run one controlled paid `/svc/forge` proof after the Business Builder operational-accuracy gate was deployed.

This was not an external customer proof. It was a controlled buyer-style paid proof using a rule-heavy PolicyPool-style brief, chosen because prior feedback rated AgentForge about 3/5 when the output was personalized but materially wrong.

No OKX public review or rating was submitted.

## Payment

Endpoint:

- `https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge`

Challenge:

- Network: X Layer (`eip155:196`)
- Token: USDT / USD₮0 (`0x779ded0c9e1022225f8e0630b35a9b54be713736`)
- Amount: `0.40 USDT` (`400000` atomic)
- Pay to: `0xfc9b58e81bce27c2f46558d501228d935f93e802`

Settlement:

- HTTP replay status: `200`
- Payment status: `success`
- Transaction: `0x128341f8dc909132be93ed9b0bf17d3f831da27ba520d57b3d474a21335566a0`
- Payer: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- Output hash: `d1d6d2bafd52b3d0dbd37dc7b952f2d1a2ae85fd88df16b651dbd4f99f48740d`

Ledger:

- `serviceCallId`: `sc_forge_128341f8dc90`
- `transactionId`: `lt_forge_128341f8dc90`
- Split: `400000` atomic Forge gross / `0` founder payable / `0` referral
- Live `/ledger/summary` after proof: `7` paid calls, `3450000` settled atomic, `3130000` Forge revenue atomic

## Request summary

Buyer-style brief:

- Founder/service: `PolicyPool`
- Domain: reserve-backed coverage receipts for eligible accepted OKX.AI agent jobs
- Buyer: OKX.AI buyers/providers needing objective deadline accountability
- Required output:
  - free eligibility preflight
  - paid covered job receipt
  - marketplace copy and buyer-input checklist
  - fee/cap/reserve/deadline separation
- Forbidden drift:
  - insurance
  - underwriting
  - risk ratings
  - universal coverage
  - automatic settlement
  - guaranteed payout
  - buyer-selected deadline
  - signed/anchored/funded/active covenant claims without evidence

## Result

The final `deliverable` passed the new gate.

`operationalAccuracy`:

- `passed`: `true`
- `domain`: `coverage-accountability`
- `forbiddenClaimDrift`: `[]`
- `warnings`: `[]`
- failed rules: `[]`

Money model:

- `eligibility preflight`: `0 USDT`
- `paid receipt service fee`: `0.1 USDT`
- `requested coverage cap`: separate from service fee, amount derived from buyer request and policy/reserve check
- `reserve capacity`: separate public reserve constraint, not an automatic settlement promise

Input fidelity:

- `passed`: `true`
- missing fields: `[]`
- warning: model draft missed buyer-specific details, but AgentForge repaired the paid deliverable from original buyer input

Quality read:

- The final deliverable is materially stronger than the prior 3/5 output.
- The core PolicyPool mistakes were corrected: free preflight stayed free, paid receipt fee stayed separate, cap/reserve/deadline were separated, the deadline was SLA-derived, and no insurance/automatic-settlement/guaranteed-payout claims appeared in the final deliverable.
- The output is now usable as a structured starting package, subject to founder review before public listing or reuse.

## Issue found during review

The raw paid response still included `agentSpecDraft`, an intermediate model draft. That draft was not the buyer-facing product and could contain unrepaired scaffold such as:

- category drift (`finance`)
- draft-only service prices such as `15 USDT`
- model-draft wording that the final deliverable had already corrected

This did not break the final `deliverable`, but it could confuse buyers who inspect the full JSON response.

## Fix

Added a response-shape fix:

- Paid responses now omit raw `agentSpecDraft`.
- Paid responses include `draftAudit` instead.
- `draftAudit` discloses that a raw model draft existed, records summary metadata, and tells the buyer to use the corrected `deliverable` instead.

Regression test:

- `apps/runtime/src/draft-audit.test.ts`

## Validation

Passed after the fix:

- `npm run test --workspace @agentforge/runtime -- src/business-builder.test.ts src/draft-audit.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Production follow-up

Pushed:

- `c670ea2 [runtime] hide raw draft from paid forge responses`

Deployed:

- Railway runtime production deployment `97e7fa5d-f4cd-4d00-a95d-ae71fac8b774`

Live checks after deployment:

- `GET /health`: `200`, `ok: true`
- `GET /svc/forge`: `200`, price `0.40 USDT`
- `POST /svc/forge/preflight`: `200`, `ok: true`, `bodyReadyForPayment: true`, `noPaymentAttempted: true`
- unpaid `POST /svc/forge`: expected `402` payment challenge
- `GET /ledger/summary`: `200`, `7` paid calls, `3450000` settled atomic, latest call `sc_forge_128341f8dc90`

No second paid call was made after the response-shape fix. The paid-response shape is covered by runtime tests and is now deployed for the next approved paid call.

## Boundary

- One approved 0.40 USDT x402 payment was made.
- No second payment was made for the response-shape fix.
- No OKX task review/rating was submitted.
- No OKX listing edit, wallet transfer beyond the approved payment, anchor, X/Twitter post, or Google form action was run.
