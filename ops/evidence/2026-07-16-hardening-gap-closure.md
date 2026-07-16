# Production Hardening Gap Closure - 2026-07-16

Scope:
- Closed the remaining immediately actionable production-hardening gaps after deployment
  `0a95b690-efed-43db-b002-382acff78634`.
- No paid proof, wallet transfer, listing update, X/Twitter post, Google form submission, or public
  disclosure action was run.
- The private customer-security audit-log entry remained local-only and was not added to public surfaces.

Changes:
- Added listener-level runtime integration coverage in
  `apps/runtime/src/server-listener.test.ts`.
  - Starts the real Node HTTP listener on an ephemeral local port.
  - Mocks x402 at the unpaid challenge layer.
  - Verifies listener-level `200` and unpaid `402` response contracts with security headers.
  - Drills x402 facilitator initialization failure, quote-store unavailability, expired
    `af_quote`, and mismatched `af_quote` before any payment processing.
- Added catalog parity coverage in `apps/web/src/lib/tenant-catalog-parity.test.ts`.
  - Compares web-visible catalog fields against `packages/core/src/tenant-catalog.ts`.
  - Runtime/web drift in price display, status, route, category, service copy, persona summary,
    refusal boundaries, or proof refs now fails the workspace test suite.
- Added `ops/outage-drills.md` and linked it from the deployment runbook.
- Updated the hardening execution plan to mark listener tests, catalog drift prevention, and
  non-paid outage drills closed.
- Left separate-volume distributed ledger durability explicitly bounded: JSONL remains valid only
  for one runtime replica or multiple same-volume writers. Arbitrary separate-volume scaling still
  requires a future transactional store.

Validation:
- `npm run test --workspace @agentforge/runtime -- server-listener.test.ts paid-delivery.test.ts payment-quote.test.ts` passed.
- `npm run test --workspace @agentforge/web -- tenant-catalog-parity.test.ts` passed.
- `npm run test --workspace @agentforge/core -- anthropic-client.test.ts` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.
- `npm test` passed: 33 test files, 195 tests.
- `npm run build` passed, including the Next.js production build.
- `npm audit --omit=dev` returned `found 0 vulnerabilities`.
- `npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app` passed:
  `/health`, `/ready`, `/svc/forge/info`, unpaid `/svc/forge` 402, advertised Forge preflight, and
  malformed-body rejection.
