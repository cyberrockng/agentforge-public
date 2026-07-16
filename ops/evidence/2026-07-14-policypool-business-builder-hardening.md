# PolicyPool Business Builder hardening · 2026-07-14

## Trigger

External buyer feedback on the AgentForge `/svc/forge` PolicyPool deliverable:

- Payment/delivery succeeded at `0.40 USD₮0`.
- Output was personalized but not publish-ready.
- It incorrectly priced free preflight, used "signed" covenant language, let buyers supply the
  deadline instead of deriving it from verified acceptance plus SLA, weakened reserved liability into
  later payout review language, labeled PolicyPool as finance, and included generic intake
  boilerplate.

## Fix

Added a coverage-accountability domain path in the Business Builder runtime:

- Detects coverage/covenant/reserve-backed accepted-job services from positive service facts.
- Forces PolicyPool-style products away from `finance` positioning into business accountability.
- Splits the service menu into:
  - free `Eligibility Preflight` at `0 USDT`;
  - paid `Covered Job Receipt` using the founder's stated service fee.
- Keeps coverage cap separate from service fee.
- Requires job-specific inputs:
  - `targetAgent`;
  - `targetJobId`;
  - `targetCreationTxHash`;
  - `targetAcceptanceTxHash`;
  - `jobDescription`;
  - `requestedCoverageUSDT`;
  - provider policy/SLA reference or enough public context to derive deadline.
- Adds refusal/out-of-scope rules against insurance claims, universal coverage, guaranteed outcomes,
  automatic settlement, unsigned/unsupported "signed covenant" claims, buyer-chosen deadlines,
  non-opted-in providers, non-accepted jobs, and coverage beyond job value/policy/reserve.
- Adds public-copy language that keeps preflight free, calls receipts reserve-bounded, and avoids
  payout-review drift.

## Regression

Added `business-builder.test.ts` coverage that recreates a finance-drifted PolicyPool draft and
asserts:

- category is repaired to `business`;
- free preflight remains `0`;
- paid receipt remains `0.1`;
- coverage cap is not treated as the service fee;
- buyer inputs include the accepted-job and transaction refs;
- buyer-chosen deadline, `signed covenant`, and `payout review` do not appear in public claim
  surfaces.

## Validation

Passed locally:

- `npm run test --workspace @agentforge/runtime -- src/business-builder.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Boundary

- No payment, review, OKX listing update, deployment, wallet action, anchor, X/Twitter post, or
  Google form action was run.
- Initial fix commit was repo-local until pushed and deployed.

## Push + production deploy

Commit pushed:

- `f8172c8 [runtime] harden coverage business builder output`

Railway runtime production deployment:

- Deployment id: `981397fb-e97a-4940-b53d-845fc0a57425`
- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Volume remained mounted at `/data` as `agentforge-runtime-volume`.

Live no-payment verification:

- `GET /health` returned HTTP `200` with `ok: true`.
- `GET /svc/forge` returned HTTP `200` with service `AI Agent Business Builder` and price
  `0.40 USDT`.
- `POST /svc/forge/preflight` with the PolicyPool brief returned HTTP `200`,
  `ok: true`, `bodyReadyForPayment: true`, and `noPaymentAttempted: true`.
- `POST /svc/forge` with the same body and no payment returned HTTP `402` with a payment
  challenge.

Vercel:

- Not redeployed for this fix because no web app code or public web data changed; the corrected
  behavior lives in the Railway runtime `/svc/forge` path.

Updated boundary:

- No payment, review, OKX listing update, wallet action, anchor, X/Twitter post, or Google form
  action was run during deployment verification.
