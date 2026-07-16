# Business Builder output relevance fix · 2026-07-14

## Reason

The controlled buyer proof showed the core product worked, but one quality issue remained: buyer
input lists could become noisy. In the `RequestDesk AI` proof, wallet/security intake fields appeared
even though the requested service was buyer-support triage, not wallet-risk review.

This matters because a real buyer could fairly rate the output lower if it feels partially generic or
cross-contaminated from another service type.

## Root cause

The Business Builder classified the service domain using the whole founder request, including refusal
boundaries. Boundaries such as `no private keys`, `no wallet secrets`, and `no payment execution`
were enough to trigger wallet/security intake fields even when the positive service description was
not wallet-security work.

## Fix

- Domain-specific intake is now selected from the positive service description:
  - expertise area;
  - services offered;
  - brand name.
- Refusal boundaries still appear in operating rules, but they no longer choose the service domain.
- Domain-specific buyer inputs returned by the model are filtered if they do not match the inferred
  service domain.
- Wallet/security fields remain active for wallet-security services.
- Launch/listing fields remain active for OKX.AI listing/launch services.
- General services keep broad, non-domain-specific intake fields only.

## Regression coverage

Added runtime test:

- `does not infer wallet-security intake from refusal boundaries alone`

The test uses the same controlled proof shape:

- founder: `Controlled Buyer Proof #1`
- brand: `RequestDesk AI`
- service: support triage for OKX.AI service providers
- boundaries mentioning private keys, wallet secrets, and payment execution

Expected result:

- keeps support-triage inputs such as raw buyer message and ASP service offering;
- removes wallet/security-only inputs such as suspicious URL, token contract, wallet prompt,
  transaction hash, chain/network, connected wallet, and signed/moved-funds fields;
- removes irrelevant marketplace/agent-id launch fields.

## Validation

- `npm run test --workspace @agentforge/runtime -- business-builder.test.ts` passed.
- `npm run test --workspace @agentforge/runtime` passed.
- `npm run typecheck --workspace @agentforge/runtime` passed.
- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Production deployment

- Commit pushed: `92e3448 [runtime] tighten business builder buyer intake relevance`.
- Railway runtime deployment:
  - id: `ca194c36-ee47-44ec-bed2-dffcdb7cef0e`;
  - URL: `https://agentforge-runtime-production-9a4d.up.railway.app`;
  - status: `SUCCESS`.
- No Vercel deployment was required because this was a runtime output-generation fix.

Live verification after deploy:

- `GET /health` returned `ok: true`.
- `GET /svc/forge/preflight` returned `ok: true`, `price: 0.40 USDT`,
  `noPaymentAttempted: true`, and command guidance containing `--body`.
- `GET /ledger/summary` remained stable at:
  - `paidCalls: 4`
  - `settledAtomic: 2250000`
  - `latestCall: sc_forge_1aaa3110dbcb`

## Boundary

- No payment was run.
- No OKX review, listing update, anchor, wallet action, X/Twitter, or Google form action was run.
- This is a product-quality fix, not a new proof or traction claim.
