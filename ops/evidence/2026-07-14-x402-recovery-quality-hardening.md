# x402 Recovery and Business Builder Quality Hardening

Date: 2026-07-14

## Trigger

A paid Business Builder x402 task settled, but the replay to `/svc/forge` failed at the network level before the buyer received a deliverable through the platform. Because `onchainos agent deliver` is escrow-only, there was no platform artifact channel for this x402 task after the replay failed.

## Changes

- Added `/svc/<tenant>/recovery` as a buyer-visible recovery contract.
- Successful paid responses now include a recovery handle with:
  - `recoveryId`
  - `requestBodySha256`
  - `recoveryEndpoint`
  - clear complete-or-refund guidance
- Successful paid responses attempt to persist a private delivery archive keyed by service call id.
- Recovery requires the paid reference plus the original body or body hash before returning an archived private deliverable.
- If AgentForge has no delivered ledger row for the paid reference, recovery returns `manual_make_good_required` instead of pretending it can regenerate automatically.
- Business Builder deliverables now include `qualityReport` with input fidelity, requested-service coverage, boundary compliance, forbidden-claim, review-safety, and operational-accuracy checks.
- Business Builder generation now fails closed if the quality report, input fidelity, or operational accuracy checks do not pass.
- `/hire` now documents preflight, paid-body reuse, recovery, and honest-review timing.
- Public proof log records the recovery hardening as an incident/process entry with zero review claim.

## 2026-07-15 Addendum: Quote-Bound Empty-Replay Recovery

Trigger:

- Real buyer testing showed a separate OKX task-flow failure class: the task payment replay can reach the
  provider endpoint with `{}` even when the buyer supplied a valid parameterized body.
- The correct product behavior is not to accept bare `{}`. AgentForge must keep validation strict and
  recover only when a prior free preflight validated the body.

Change:

- `/svc/forge/preflight` now persists a short-lived private payment quote under `/data/agentforge/payment-quotes`.
- Successful preflight returns `quote.id`, `quote.paidEndpoint`, `quote.expiresAt`, and
  `quote.requestBodySha256`.
- Buyers should request the fresh 402 challenge and paid replay against
  `/svc/forge?af_quote=<QUOTE_ID_FROM_PREFLIGHT>`.
- If a paid replay arrives with `{}` and a valid, unexpired `af_quote`, AgentForge recovers the
  preflight-validated body before payment settlement.
- If the body is present but does not match the quote, AgentForge rejects before settlement with
  `quote_body_mismatch`.
- If payment verification is not bound to the same `af_quote` resource URL, AgentForge rejects before
  settlement with `quote_payment_mismatch`.

Boundary:

- Bare `{}` still fails before payment.
- Expired, missing, malformed, or cross-tenant quote ids fail before payment.
- This addendum is a code/docs change only until pushed and deployed; do not treat it as live
  production behavior until Railway/Vercel deployment and live verification are recorded.

Validation:

- `npm run test --workspace @agentforge/runtime -- src/payment-quote.test.ts src/forge-preflight.test.ts src/delivery-recovery.test.ts`
- `npm run typecheck --workspace @agentforge/runtime`
- `npm run test --workspace @agentforge/web -- src/lib/agentforge-checkout.test.ts`
- `npm run typecheck --workspace @agentforge/web`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Privacy Boundary

The private buyer make-good body and deliverable are not published on public proof surfaces. Public copy records only the reliability class, endpoint path, and review caveat.

## Remaining Platform Gap

If a paid x402 replay never reaches the AgentForge endpoint, the runtime cannot archive or regenerate from server-side state. The buyer must provide the job id, payment transaction, and exact JSON body for manual make-good delivery or agree-refund. This should be flagged to OKX as a parameterized x402 fallback gap.

## Production Deployment

Runtime:

- Host: Railway
- Deployment: `f61f6d37-076e-4f1e-b7a8-329281f67650`
- URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Verified:
  - `GET /health` returned HTTP 200.
  - `GET /svc/forge` returned `recoveryRoute: /svc/forge/recovery` and price `0.40 USDT`.
  - `GET /svc/forge/recovery` returned the recovery contract and manual make-good fallback.
  - Unpaid valid `POST /svc/forge` returned HTTP 402 with `payment-required` header amount `400000`.
  - Fake `POST /svc/forge/recovery` returned `payment_not_found_in_agentforge_ledger` with `manual_make_good_required`, proving recovery does not leak private deliverables from a transaction hash alone.

Web:

- Host: Vercel
- Deployment: `dpl_GPo8gEnQQFr1fPhKpg2N31T8boXS`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Verified:
  - `GET /hire` returned HTTP 200 and includes recovery endpoint, recovery copy, honest-review copy, and `0.40 USDT`.
  - `GET /proof-log` includes the x402 lost-replay recovery entry, zero-review-claim metric, and private-input caveat.

Note: the unique deployment URL `https://web-4lltqsuf9-cyberrockng-s-projects.vercel.app` is protected by Vercel SSO; the public alias above is the buyer-facing URL.

## Buyer-Side Make-Good Confirmation

The buyer later confirmed they received and read the directly pasted make-good package for job
`0xc5750af84051681b1bf39ca2d900bfaf9c0296861f8ab504e5f5dda4905e11e5`.

Observed buyer-side platform state:

- Direct make-good delivery was readable and accepted as faithful/useful by the buyer.
- `complete` failed with `x402_no_deliverable`.
- `feedback-submit` failed with `TASK_NOT_COMPLETED`.
- Result: the original paid x402 task is permanently uncompletable/unreviewable through OKX because
  the original replay failed before a platform-side deliverable existed.

Evidence boundary:

- This is an off-platform make-good confirmation, not an OKX marketplace review.
- Do not count this as a verified on-chain review, rating, or completed task.
- A clean review requires a fresh paid order whose replay succeeds through the platform, followed by
  normal buyer completion and feedback.
