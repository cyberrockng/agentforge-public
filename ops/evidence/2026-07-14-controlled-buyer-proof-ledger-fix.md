# Controlled buyer proof #1 ledger fix · 2026-07-14

## Scope

User approved one controlled buyer-style proof against AgentForge `/svc/forge` using the new
preflight flow. The proof uses a self-funded buyer-style request, not an external customer.

## Buyer body

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
- command template included `--body`

## Payment attempt result

Fresh `/svc/forge` challenge decoded to:

- x402 version: `2`
- network: `eip155:196`
- amount: `400000`
- display amount: `0.40 USDT`
- service id: `ai-agent-business-builder`
- tenant: `forge`

The signed replay returned HTTP `400` instead of a delivered response:

```json
{
  "error": "forge_delivery_failed",
  "message": "Ledger journal integrity check failed: Duplicate service_call id: sc_forge_quote_20260714133814965; Duplicate service_call id: sc_forge_quote_20260714133814965; Duplicate service_call id: sc_forge_quote_20260714133814965; Duplicate service_call id: sc_forge_quote_20260714133814965; Duplicate service_call id: sc_forge_quote_20260714133814965"
}
```

Wallet history shows a successful X Layer transaction for the attempt:

- tx hash: `0x32ff45e2b65719f43815a5b7bc15aa74f8f6f047cdacaf76863e5195dc9d9054`
- from: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- to: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- tx status: `SUCCESS`
- input amount shown by wallet history: `0`
- service charge USD shown by wallet history: `0.000139`

Because the payer and payee are the same AgentForge wallet and the runtime did not return a
deliverable or ledger receipt, this is recorded as a failed-delivery controlled proof attempt, not as
external revenue and not as a completed paid proof.

## Root cause

Production `/data` still contains duplicate legacy `quoted` service-call rows from before quote-row
persistence was removed. Public ledger summary already filtered those rows, but append-time journal
integrity still checked the full historical file before adding new delivered rows. That caused the
runtime to fail after payment processing when it tried to append the new delivered service-call and
ledger-transaction records.

## Fix

- `appendLedgerJournal` now filters historical rows to delivered service calls and ledger
  transactions before append-time integrity checks.
- New rows remain strictly checked, so duplicate delivered service-call ids, duplicate delivered
  payment refs, duplicate ledger transactions, and unbalanced ledger entries still fail closed.
- Added regression test proving duplicate legacy `quoted` rows do not block a new delivered append.

## Production deployment

- Fix commit pushed: `3988df0 [payments] tolerate legacy quote rows on ledger append`.
- Railway runtime deployment:
  - id: `3fb9ae3a-4fb4-47b2-b7f9-08eebf799847`;
  - URL: `https://agentforge-runtime-production-9a4d.up.railway.app`;
  - status: `SUCCESS`.
- No Vercel deployment was required because this was a runtime/payments-package fix only.

## Validation

- `npm run test --workspace @agentforge/payments` passed.
- `npm run test --workspace @agentforge/runtime` passed.
- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

Live production verification after Railway deploy:

- `GET /svc/forge/preflight` returned `ok: true`, `bodyReadyForPayment: false`, and `0.40 USDT`.
- `GET /ledger/summary` returned stable values:
  - `paidCalls: 3`
  - `settledAtomic: 1850000`
  - `forgeRevenueAtomic: 1530000`
  - `founderPayableAtomic: 320000`
  - `latestCall: sc_launch-kit_3b103d9976a5`
- Valid unpaid `POST /svc/forge` returned HTTP `402` with `amount: 400000`,
  `displayAmount: 0.40 USDT`, and `serviceId: ai-agent-business-builder`.
