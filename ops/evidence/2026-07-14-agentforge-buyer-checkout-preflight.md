# AgentForge buyer checkout + preflight hardening · 2026-07-14

## Reason

Real buyer patronage exposed a buyer-support/review risk: a task can settle while the
endpoint receives the wrong body, then OKX task automation may still submit a lower
rating. AgentForge already validates malformed `/svc/forge` bodies before x402, but
buyers needed a visible no-payment path to test the exact body before paying.

## Implemented

- Added runtime `GET /svc/forge/preflight`:
  - returns service metadata, required fields, example body, command templates, and buyer warnings;
  - performs no payment, no settlement, no ledger write, no review, no anchor, and no proof claim.
- Added runtime `POST /svc/forge/preflight`:
  - parses the same `FounderInterviewInputSchema` used by paid `/svc/forge`;
  - returns `bodyReadyForPayment: true`, `normalizedBody`, and `bodyJson` only when the body is valid;
  - returns `400 invalid_request_body` with `noPaymentAttempted: true` when the body is invalid;
  - is rate-limited using the existing in-memory per-IP runtime limiter.
- Added web `/hire` buyer checkout page:
  - lists AgentForge `#3746`, `AI Agent Business Builder`, `0.40 USDT`, x402 on X Layer;
  - shows the required JSON fields and free preflight command;
  - shows a manual `task-402-pay` fallback template with `--body` included;
  - warns that some OKX task clients may auto-complete/auto-review after task completion.
- Linked `/hire` from `/`, `/forge`, and `/a/forge`.

## Boundary

- No OKX task, payment, review, listing edit, wallet transfer, anchor, X/Twitter post, or Google form
  action was run.
- This change does not create traction, revenue, ratings, founders, receipts, or proof.
- The page intentionally uses known records only: AgentForge `#3746`, live `/svc/forge`, and current
  `0.40 USDT` price.

## Production deployment

- Implementation commit pushed: `e3b9931 [product] add AgentForge buyer preflight checkout`.
- Railway runtime deployment:
  - id: `b3d3cacf-249b-4c84-af64-0c9d6ecbad1e`;
  - URL: `https://agentforge-runtime-production-9a4d.up.railway.app`;
  - volume remained mounted at `/data`.
- Vercel web deployment:
  - id: `dpl_56F7YUXBawBWmv6rwrJ2Uay332W6`;
  - deployment URL: `https://web-j5q6t0ped-cyberrockng-s-projects.vercel.app`;
  - stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`.

## Validation

- `npm run test --workspace @agentforge/runtime` passed.
- `npm run test --workspace @agentforge/web` passed.
- `npm run typecheck --workspace @agentforge/runtime` passed.
- `npm run typecheck --workspace @agentforge/web` passed.
- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

Local runtime smoke against `127.0.0.1:4123`:

- `GET /svc/forge/preflight` returned `ok: true`, `bodyReadyForPayment: false`,
  `price: 0.40 USDT`, and command guidance containing `--body`.
- Valid `POST /svc/forge/preflight` returned `ok: true`, `bodyReadyForPayment: true`,
  `noPaymentAttempted: true`, and normalized buyer body.
- Invalid `POST /svc/forge/preflight` returned HTTP `400`, `ok: false`,
  `noPaymentAttempted: true`, and field-level repair guidance.

Live production verification:

- `GET /svc/forge/preflight` returned `ok: true`, `bodyReadyForPayment: false`,
  `price: 0.40 USDT`, and command guidance containing `--body`.
- Valid `POST /svc/forge/preflight` returned `ok: true`, `bodyReadyForPayment: true`,
  `noPaymentAttempted: true`, and normalized buyer body.
- Invalid `POST /svc/forge/preflight` returned HTTP `400`, `ok: false`,
  `noPaymentAttempted: true`, and field-level repair guidance.
- `GET /svc/forge` returned `status: public`, `price: 0.40 USDT`, input schema, and example body.
- Valid unpaid `POST /svc/forge` returned HTTP `402`; the `payment-required` header decoded to
  x402 v2, `amount: 400000`, `displayAmount: 0.40 USDT`, `serviceId: ai-agent-business-builder`,
  `network: eip155:196`, and the AgentForge project `payTo` address.
- `GET /ledger/summary` stayed stable at `paidCalls: 3`, `settledAtomic: 1850000`,
  `forgeRevenueAtomic: 1530000`, and `founderPayableAtomic: 320000`.
- Web alias returned HTTP `200` for `/hire`, `/forge`, `/a/forge`, and `/`.
- `/hire` rendered `bodyReadyForPayment`, `task-402-pay`, `auto-review`, and `0.40 USDT`.
