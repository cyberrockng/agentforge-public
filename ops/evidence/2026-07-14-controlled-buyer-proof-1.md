# Controlled buyer proof #1 · AgentForge `/svc/forge` · 2026-07-14

## Classification

Controlled/self-funded buyer-style proof.

This is not external customer revenue, not a public review, and not G2 founder traction. It proves the
buyer preflight → x402 payment → model-backed delivery → ledger append path after the ledger fix.

## Request

- Service: AgentForge `/svc/forge`
- Service title: `AI Agent Business Builder`
- Price: `0.40 USDT`
- Buyer body:
  - `founderName`: `Controlled Buyer Proof #1`
  - `brandName`: `RequestDesk AI`
  - `expertiseArea`: `AI customer support triage for small OKX.AI service providers`
  - `targetCustomer`: `new OKX.AI ASPs receiving messy buyer requests and support messages`
  - `pricingPreference`: `0.40 USDT launch price until two or three real paid calls are reviewed`

## Preflight

`POST /svc/forge/preflight` returned:

- `ok: true`
- `bodyReadyForPayment: true`
- `noPaymentAttempted: true`
- `price: 0.40 USDT`
- `brandName: RequestDesk AI`

## Payment and delivery

Fresh x402 challenge:

- x402 version: `2`
- amount: `400000`
- display amount: `0.40 USDT`
- service id: `ai-agent-business-builder`

Replay result:

- HTTP status: `200`
- response status: `delivered`
- tx hash: `0x1aaa3110dbcbe21d23299e9332509464bb5db71e7f8464639badd7ea8bf84046`
- receipt amount: `400000`
- service call id: `sc_forge_1aaa3110dbcb`
- ledger transaction id: `lt_forge_1aaa3110dbcb`
- split:
  - founder amount: `0`
  - Forge gross: `400000`
  - referral: `0`
  - Forge net: `400000`

Wallet history details for the tx:

- from: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- to: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- tx status: `SUCCESS`
- service charge USD shown by wallet history: `0.000138`

Because payer and payee are the same AgentForge wallet, this is useful product-path proof but not
external revenue.

## Deliverable check

Returned deliverable:

- title: `AI Agent Business Builder`
- founder: `Controlled Buyer Proof #1`
- brand: `RequestDesk AI`
- first service: `Buyer Request → Service Scope`
- service menu count: `3`
- `pricingPlan`: present
- `proofGuidance`: present
- `inputFidelity.passed`: `true`
- `inputFidelity.missingFields`: `[]`
- `inputFidelity.repairedFields`: `["pricingPreference"]`
- next actions count: `3`

The output used the buyer-specific brand, founder, target customer, and service concept. This avoids
the Foreman-style generic-output failure class for this controlled proof.

## Ledger verification after delivery

`GET /ledger/summary` returned:

- `paidCalls: 4`
- `settledAtomic: 2250000`
- `forgeRevenueAtomic: 1930000`
- `founderPayableAtomic: 320000`
- latest call: `sc_forge_1aaa3110dbcb`
- latest tx: `0x1aaa3110dbcbe21d23299e9332509464bb5db71e7f8464639badd7ea8bf84046`
- latest amount: `400000`

## Boundary

- No OKX review was submitted.
- No OKX listing edit was run.
- No anchor was created.
- No external customer claim was made.
- No private buyer content was published beyond this self-funded controlled proof body and redacted
  deliverable summary.
