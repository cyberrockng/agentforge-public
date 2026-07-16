# Business Builder operational accuracy gate · 2026-07-14

Status: DONE-LIVE

## Trigger

External buyer feedback on the PolicyPool `/svc/forge` proof said AgentForge delivered and personalized the package, but the output still required material correction before use:

- free preflight was blurred with the paid receipt fee
- covenant language drifted toward unsupported "signed" wording
- the deadline was treated like buyer-supplied input instead of being derived from verified acceptance plus SLA
- reserve liability was weakened into payout-review language
- category and intake remained too generic for the product's actual rules

This is the product-quality gap: personalized output is not enough if the buyer cannot use it safely without correcting the operating model.

## Fix

Added `operationalAccuracy` to the Business Builder deliverable.

The gate records:

- `passed`
- service `domain`
- a buyer-facing requirement: usable without material correction against buyer-stated operating rules
- `moneyModel` with service fee/cap/reserve separation where relevant
- `rulesChecked`
- `forbiddenClaimDrift`
- `warnings`

For coverage-accountability products, the gate checks the exact rules that failed in the external feedback:

- eligibility preflight remains free
- paid receipt fee is separate from requested coverage cap
- reserve capacity is separate from service revenue
- deadline is derived from verified acceptance plus SLA
- service is not insurance/underwriting
- no automatic-settlement, guaranteed-payout, buyer-selected-deadline, or unsupported signed-covenant claims

For generic launch/business outputs, unsupported guarantee copy is repaired before public launch surfaces are returned.

## Regression tests

Added/expanded runtime tests for:

- PolicyPool-style free preflight / paid receipt / cap / reserve separation
- `operationalAccuracy.passed === true` on corrected coverage output
- `operationalAccuracy.moneyModel` labels for preflight, paid receipt fee, requested coverage cap, and reserve capacity
- no forbidden claim drift on compliant negative caveats such as "not insurance"
- repair of unsafe "guaranteed approval/revenue/customers/ratings" copy before it reaches service menu output

## Local validation

Passed:

- `npm run test --workspace @agentforge/runtime -- src/business-builder.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Production

Pushed:

- `ee837e3 [runtime] add business builder operational accuracy gate`

Deployed:

- Railway runtime production deployment `6d0045a0-fc1e-4656-a584-b0b57ad5132e`

Live checks:

- `GET /health` returned `ok: true`
- `GET /svc/forge` returned 200 and the live service price remained `0.40 USDT`
- `POST /svc/forge/preflight` with the PolicyPool-style body returned `ok: true`, `bodyReadyForPayment: true`, and `noPaymentAttempted: true`
- unpaid `POST /svc/forge` returned the expected `402` payment challenge
- `GET /ledger/summary` returned 200 with `6` paid calls and `3.05 USDT` settled

Internal QA note:

- The Forge Gate QA path rejected the normal buyer body with `invalid_forge_gate_qa_body`, because that harness blocks metadata-like payloads. This was not forced. The output-level behavior is covered by local runtime regression tests; live verification stayed no-payment.

## Boundary

- No payment was made.
- No OKX review was submitted.
- No OKX listing edit was run.
- No wallet, anchor, X/Twitter, or Google form action was run.
