# A1–E2 service readiness hardening · 2026-07-14

## Scope

Executed the first service-readiness sequence from the external six-angle review:

- A1: deploy the input-fidelity runtime.
- A3/B1: make the `pricing plan` and proof guidance claims true in the `/svc/forge` deliverable.
- A4: add the customer privacy rule before cold-buyer proofs.
- E1: add rate limiting and remove anonymous unpaid quote-write amplification.
- E2: make quote ids collision-safe.

No paid cold-buyer proof was run in this pass.

## A1 Railway deployment

- Pushed `4b57db0 [review] add Codex execution refinement` to `origin/main`.
- Railway deployment id: `191fee14-7e13-4fdf-ba75-7f2a90503f6c`.
- Railway deploy message: `A1 deploy input-fidelity runtime 4b57db0`.
- Deployment status: `SUCCESS`.
- Runtime: `https://agentforge-runtime-production-9a4d.up.railway.app`.

Live checks:

- `GET /health` returned `200`.
- `GET /svc/forge` returned `price: "0.40 USDT"`, `status: "public"`, and an input schema.
- Authenticated zero-priced QA delivery against `/svc/forge` returned `status: "qa_delivered"` and
  included `output.inputFidelity`.

The first A1 deployment exposed an implementation bug: `output.inputFidelity` existed, but the
checker did not scan the repaired customer positioning field, so `inputFidelity.passed` could be
false even when the delivered payload carried the buyer's target-customer signal. The later
hardening deployment corrected the checker and live QA then returned `inputFidelity.passed: true`.

## E1/E2 hardening

Implemented:

- `/svc/:tenant` now applies an in-memory per-IP rate limit before body/payment processing.
  - Default: `30` requests / `60_000ms`.
  - Env overrides:
    - `AGENTFORGE_SERVICE_RATE_LIMIT_MAX`
    - `AGENTFORGE_SERVICE_RATE_LIMIT_WINDOW_MS`
  - Over-limit response: HTTP `429` with `Retry-After` and `X-RateLimit-*` headers.
- Zero-priced authenticated Forge Gate QA calls bypass the public-service rate limiter.
- Anonymous unpaid x402 quote responses no longer persist quoted `ServiceCall` rows to the durable
  JSONL journal. Runtime quote counters may still increment in memory, but durable ledger rows are
  reserved for settled economic events.
- Quote ids now include a sanitized nonce so same-millisecond quote bursts do not collide if bounded
  quote storage is reintroduced.

Committed and pushed:

- `7cd4f11 [runtime] harden service readiness before cold buyers`.

Railway deployment:

- Deployment id: `10a04f4a-4e62-4248-9194-d80b7ddf96e9`.
- Deploy message: `A1-E2 service readiness hardening 7cd4f11`.
- Deployment status: `SUCCESS`.

## A3/B1 product output hardening

Added to `/svc/forge` business-builder deliverables:

- `pricingPlan`
  - launch price,
  - price source,
  - rationale,
  - step-up rule,
  - review trigger.
- `proofGuidance`
  - first proof-call instruction,
  - receipt checklist,
  - public evidence boundary,
  - privacy rule.

This makes the public `pricing plan` promise true by deliverable structure rather than only by
per-service `priceUsdt` values.

## A4 privacy rule

Updated `AGENTS.md`:

- Buyer inputs and deliverables are private by default.
- Public evidence may include buyer content only with explicit consent.
- Without consent, evidence should use hashes, transaction refs, service ids, and redacted summaries.
- Consent/redaction note must exist before any cold-buyer proof.

## Legacy quote-row recovery

After the hardening deployment, `GET /ledger/summary` returned `503` because the persistent Railway
volume still contained duplicate anonymous quoted rows written before E1 disabled quote persistence.
Those rows are not settled economic evidence, but the summary builder was still validating the full
journal including legacy quotes.

Fix:

- Public runtime summaries now filter to durable economic records before integrity validation:
  delivered `service_call` rows plus `ledger_transaction` rows.
- Delivered calls and ledger transactions still fail closed under the existing balance, duplicate,
  and payment-reference checks.
- The Railway volume was not deleted, rewritten, or manually edited.

Committed and pushed:

- `f859d6c [runtime] ignore legacy quote rows in ledger summary`.

Railway deployment:

- Deployment id: `4ad54af6-0bf0-4b76-ad69-ec844afd542b`.
- Deployment status: `SUCCESS`.
- Runtime volume: `agentforge-runtime-volume` mounted at `/data`.

Live verification after `4ad54af6`:

- `GET /health` returned `200`.
- `GET /svc/forge` returned `200` with `price: "0.40 USDT"` and an input schema.
- `GET /ledger/summary` returned `200` with:
  - `paidCalls: 3`
  - `settledAtomic: "1850000"`
  - `forgeRevenueAtomic: "1530000"`
  - `founderPayableAtomic: "320000"`
- Three valid unpaid `/svc/forge` requests returned `402`, and `/ledger/summary` stayed unchanged:
  `paidCalls: 3`, `settledAtomic: "1850000"`.
- Rate-limit probe returned `429` with `Retry-After` after the live bucket was exceeded.
- Authenticated zero-priced QA delivery returned:
  - `status: "qa_delivered"`
  - `output.inputFidelity.passed: true`
  - `missingFields: []`
  - `repairedFields: ["pricingPreference"]`
  - `pricingPlan.launchPriceUsdt: 0.4`
  - `proofGuidance.receiptChecklist.length: 5`
- Public web checks returned `200` for `/dashboard`, `/guild`, `/judges`, and `/proof-log`;
  `/dashboard` and `/judges` rendered the live `1.85 USDT` settled ledger total.

## Validation

Focused validation passed:

- `npm run test --workspace @agentforge/payments`
- `npm run test --workspace @agentforge/runtime`
- `npm run typecheck --workspace @agentforge/runtime`
- `npm run test --workspace @agentforge/runtime -- ledger-summary`

Full validation passed:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Boundary

- No paid cold-buyer call was run.
- No OKX listing update was run.
- No wallet transfer, anchor, X/Twitter, Google form, or Vercel action was run.
- No Railway volume row was deleted, rewritten, or manually edited.
