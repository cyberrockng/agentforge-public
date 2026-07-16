# AgentForge Non-Paid Outage Drills

These drills are the pre-buyer-campaign check for failure modes that must fail closed before any
x402 settlement. They do not spend funds and do not call production payment settlement.

## Automated Coverage

Run:

```bash
npm run test --workspace @agentforge/runtime -- server-listener.test.ts paid-delivery.test.ts payment-quote.test.ts
npm run test --workspace @agentforge/core -- anthropic-client.test.ts
```

Covered drills:

- Model transient outage/malformed output: `anthropic-client.test.ts` retries 529 and malformed JSON
  before returning a typed failure. Generation still happens before settlement.
- x402 facilitator unavailable: `server-listener.test.ts` starts a real HTTP listener with a mocked
  failed facilitator initialization and verifies `/svc/forge` returns `503
  payment_facilitator_not_configured` before payment processing.
- Quote-store unavailable: `server-listener.test.ts` points the quote directory at an unwritable
  device and verifies preflight returns `503 payment_quote_unavailable` with
  `noPaymentAttempted: true`.
- Expired `af_quote`: `server-listener.test.ts` creates a short-lived quote and verifies empty-body
  replay returns `410 payment_quote_expired` before x402 processing.
- Mismatched `af_quote`: `server-listener.test.ts` verifies a valid quote plus changed request body
  returns `400 quote_body_mismatch` before x402 processing.
- Settled bookkeeping outage: `paid-delivery.test.ts` verifies ledger/archive failures after a
  successful settlement still return the paid deliverable with truthful warning fields.

## Manual Production Gate

After deployment, run the no-payment live contract gate:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

This checks `/health`, `/ready`, `/svc/forge/info`, unpaid `/svc/forge` 402, security headers,
`outputSchema`, valid Forge preflight, and malformed-body rejection without settlement.

## Boundaries

- Do not run paid production proofs or adversarial paid calls without explicit human approval.
- Do not weaken request validation to make a platform replay pass. Empty-body replay is recoverable
  only through a valid quote-bound `af_quote`; bare `{}` remains rejected before payment.
- JSONL durability is bounded to `single-instance-jsonl` with one runtime replica, or
  `shared-volume-jsonl` where every runtime process writes the same mounted persistent volume. True
  separate-volume scaling requires a future transactional store with unique constraints on service
  call id, ledger transaction id, and payment transaction.
