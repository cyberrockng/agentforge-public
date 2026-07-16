# Controlled Buyer Proof #3 · DraftAudit response shape verification · 2026-07-14

Status: DONE-LIVE

## Purpose

Run the final paid proof after deploying the `draftAudit` response-shape fix.

The proof checks:

- post-payment response includes `draftAudit`
- post-payment response does not expose raw `agentSpecDraft`
- final deliverable still passes `operationalAccuracy`

This is a controlled buyer-style proof, not an external customer proof. No OKX public review/rating was submitted.

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
- Transaction: `0x3f4a02675783d9fa14f89cfe4a7236361f3d6c0d9141de4a2e00a17103480444`
- Payer: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- Deliverable hash: `fc5ee36891685c54391cc5a5a3fe0b5973600358f4aa4542f7c3947669f1955c`

Ledger:

- `serviceCallId`: `sc_forge_3f4a02675783`
- `transactionId`: `lt_forge_3f4a02675783`
- Split: `400000` atomic Forge gross / `0` founder payable / `0` referral
- Live `/ledger/summary` after proof: `8` paid calls, `3850000` settled atomic, `3530000` Forge revenue atomic

## Response-shape result

Passed:

- Top-level response included `draftAudit`
- Top-level response did not include raw `agentSpecDraft`
- `draftAudit.buyerFacingCopy`: `false`
- `draftAudit.rawDraftOmitted`: `true`
- `draftAudit.useInstead`: `deliverable`

This proves the raw model draft is no longer exposed beside the corrected buyer-facing deliverable on a real paid response.

## Quality result

Passed:

- `operationalAccuracy.passed`: `true`
- `operationalAccuracy.domain`: `coverage-accountability`
- `operationalAccuracy.forbiddenClaimDrift`: `[]`
- `operationalAccuracy.warnings`: `[]`
- failed operational rules: `[]`

Issue found:

- `inputFidelity.passed`: `false`
- missing field: `servicesOffered[2]`
- Cause: the coverage-specific builder preserved the core coverage products, but did not explicitly map the buyer-requested packaging item: "marketplace copy and buyer-input checklist that keeps coverage fee, cap, reserve, and deadline authority separate."

## Fix

Added `requestedServiceCoverage` to Business Builder deliverables.

Purpose:

- preserve every buyer-supplied `servicesOffered` item visibly
- show where each requested service is handled in the final package
- avoid inventing a separate public price for packaging/checklist work when the buyer only priced the paid receipt fee

For coverage-accountability products:

- preflight requests map to `serviceMenu.Eligibility Preflight`
- receipt/covenant requests map to `serviceMenu.Covered Job Receipt`
- marketplace copy/checklist/listing requests map to `launchCopy.marketplaceDescription`, `buyerIntake.required`, and `proofGuidance.receiptChecklist`

Regression test:

- `business-builder.test.ts` now asserts coverage packaging services are not dropped from input fidelity.

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

- `f1a772d [runtime] preserve requested service coverage`

Deployed:

- Railway runtime production deployment `d0685894-de31-4256-a30c-120c89c10488`

Live checks after deployment:

- `GET /health`: `200`, `ok: true`
- `GET /svc/forge`: `200`, price `0.40 USDT`
- `POST /svc/forge/preflight`: `200`, `ok: true`, `bodyReadyForPayment: true`, `noPaymentAttempted: true`
- unpaid `POST /svc/forge`: expected `402` payment challenge
- `GET /ledger/summary`: `200`, `8` paid calls, `3850000` settled atomic, latest call `sc_forge_3f4a02675783`

No second paid call was made after the `requestedServiceCoverage` fix. The exact failure is covered by runtime regression tests and the fix is deployed for the next approved paid call.

## Boundary

- One approved 0.40 USDT x402 payment was made.
- No second payment was made for the `requestedServiceCoverage` fix.
- No OKX public review/rating was submitted.
- No OKX listing edit, wallet transfer beyond the approved payment, anchor, X/Twitter post, or Google form action was run.
