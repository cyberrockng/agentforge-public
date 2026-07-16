# AgentForge Production Hardening Execution - 2026-07-16

## Baseline

Before edits, the repository was already green:

- `npm test` passed: 22 test files, 166 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed, including the Next.js web build.

Dirty worktree items present before this pass and preserved:

- The private operator audit log had a customer-security entry and remains excluded from public source.
- `ops/plans/PRODUCTION_HARDENING_PLAN_2026-07-16.md` was untracked.

## Completed In This Pass

### Critical - settled payment can no longer become a buyer 400 because bookkeeping failed

- Problem: ledger/archive work happened after successful x402 settlement and could throw into `forge_delivery_failed`.
- Root cause: settlement, ledger persistence, recovery-handle construction, archive write, and response serialization lived in one paid-path control flow.
- Changed files: `apps/runtime/src/server.ts`, `apps/runtime/src/paid-delivery.ts`, `apps/runtime/src/paid-delivery.test.ts`.
- Change: paid response finalization now returns the deliverable after settlement even if ledger or archive persistence fails. The response includes truthful `ledger.persisted`, `recovery.ledgerPersisted`, `recovery.archivePersisted`, receipt data, and `bookkeepingWarning`.
- Verification: unit tests cover ledger failure after settlement, archive failure after settlement, and settlement success without transaction hash.
- Rollback: revert `paid-delivery.ts` wiring only if the old behavior is explicitly accepted; otherwise rollback would reintroduce paid-error risk.

### High - ledger appends serialize across same-volume writers

- Problem: concurrent appends could validate against a stale journal tail.
- Root cause: read-check-append ran without a per-journal lock, and the first fix only serialized callers inside one Node process.
- Changed files: `packages/payments/src/journal.ts`, `packages/payments/src/ledger.test.ts`.
- Change: per-path async lock plus atomic filesystem lock directory wraps journal append validation and write. Stale locks left by interrupted processes are recovered after a bounded timeout.
- Verification: concurrent append test persists 25 paid calls and passes ledger integrity; active-lock timeout and stale-lock recovery tests cover deploy interruption behavior.
- Residual risk: this protects multiple processes writing the same persistent volume. It does not protect separate containers with separate ephemeral disks.

### High - Anthropic transient failures and malformed JSON are retried before buyer failure

- Problem: one 429/5xx/529/network blip or malformed JSON response failed the paid generation path immediately.
- Root cause: model client made one request and parsed JSON once.
- Changed files: `packages/core/src/anthropic-client.ts`, `packages/core/src/anthropic-client.test.ts`.
- Change: bounded retry for network errors, HTTP 429/500/502/503/529, and typed `ModelOutputParseError`; no retry for auth/config failures such as 401.
- Verification: tests cover 529-then-success, 401 no-retry, timeout, fenced JSON, and malformed JSON retry/failure.
- Rollback: set retry options to `maxRetries: 0` only if upstream retry behavior causes timeout pressure.

### High - rate-limit spoofing and bucket growth hardened

- Problem: raw first-hop `X-Forwarded-For` let clients mint unlimited buckets; buckets were never pruned.
- Root cause: untrusted header was treated as identity and no scheduled pruning existed.
- Changed files: `apps/runtime/src/rate-limit.ts`, `apps/runtime/src/rate-limit.test.ts`, `apps/runtime/src/server.ts`.
- Change: default client identity uses the trusted platform header (`cf-connecting-ip`) or socket address; `x-forwarded-for` is used only when explicitly configured and then uses the nearest hop. Buckets prune on interval and enforce a maximum size.
- Verification: tests cover spoofed XFF fallback, trusted header use, XFF explicit mode, bucket pruning, and cap enforcement.
- Deployment note: set `AGENTFORGE_TRUSTED_CLIENT_IP_HEADER` to the actual sanitized platform header if Railway exposes one different from `cf-connecting-ip`.

### Medium - GET/402 probe path is rate-limited

- Problem: unauthenticated GET probes could build 402 challenges without rate limiting.
- Root cause: GET path bypassed the POST service limiter.
- Changed file: `apps/runtime/src/server.ts`.
- Change: GET probe keys use `probe:<tenant>:<client>`.
- Verification: covered by runtime route tests plus rate-limit unit tests.

### Medium - runtime response headers and readiness improved

- Problem: JSON API responses lacked baseline security headers; `/health` advertised stale `t0.2-shell`.
- Root cause: headers and health body were ad hoc.
- Changed files: `apps/runtime/src/server.ts`, `apps/runtime/src/runtime-config.ts`, `apps/runtime/src/runtime-config.test.ts`.
- Change: JSON and x402 instruction responses now include `CSP: default-src 'none'`, HSTS, `nosniff`, `DENY` frame policy, and referrer policy. `/health` is liveness; `/ready` checks env, storage topology declaration, x402 initialization, and writable ledger/archive/quote directories.
- Verification: config tests cover production secret gates, test-stub rejection, single-instance replica declaration, and shared-volume mode.

### Medium - x402 challenge contract now advertises a truthful body schema

- Problem: buyer agents had to discover the POST replay body from README/preflight instead of the 402 challenge.
- Root cause: the x402 library has no first-class `outputSchema`; AgentForge did not add its own convention.
- Changed files: `apps/runtime/src/server.ts`, `apps/runtime/src/server-contract.test.ts`.
- Change: 402 JSON bodies are augmented with top-level `outputSchema` containing purpose, schema, example body, and Forge preflight endpoint when applicable.
- Verification: contract tests prove the advertised Forge example is accepted by the real validator, malformed bodies are rejected, security headers are emitted on x402 instruction responses, and server imports do not bind sockets during tests.
- Boundary: docs state clearly that OKX tooling does not auto-fill the body from this field.

### Medium - no-payment live runtime verification is executable

- Problem: live 402/readiness checks were manual and easy to skip under time pressure.
- Root cause: no single command encoded the no-payment buyer path verification.
- Changed files: `package.json`, `apps/runtime/package.json`, `apps/runtime/scripts/verify-runtime-contract.mjs`, `ops/deployment-rollback-runbook.md`.
- Change: `npm run verify:runtime -- <base-url>` checks `/health`, `/ready`, `/svc/forge/info`, unpaid `/svc/forge` 402, security headers, `outputSchema`, valid Forge preflight, and malformed preflight rejection without settlement or spend.
- Verification: script syntax is checked by build/lint; it must be run against the live deployed runtime after env changes.

### Medium - upstream Next/PostCSS advisory resolved

- Problem: `npm audit --omit=dev` reported two moderate findings through `next@16.2.10` depending on `postcss@8.4.31` (`GHSA-qx2v-qp2m-jg93`).
- Root cause: the latest stable Next release pinned an exact vulnerable PostCSS version. Npm's forced audit fix proposed `next@9.3.3`, which was an unsafe breaking downgrade.
- Changed files: `apps/web/package.json`, `package-lock.json`, `apps/web/next-env.d.ts`, `ops/evidence/2026-07-16-next-postcss-audit-fix.md`.
- Change: upgraded the web app to `next@16.3.0-preview.6`, which depends on patched `postcss@8.5.10`.
- Verification: `npm audit --omit=dev` now reports `found 0 vulnerabilities`; web tests/build and full workspace tests/typecheck/lint/build passed.
- Residual risk: `16.3.0-preview.6` is not the `latest` dist-tag. Monitor for the next stable `16.3.x` release and move back to stable when available.

## Gap-Closure Follow-Up

### Closed - listener-level 402 contract integration test

Added `apps/runtime/src/server-listener.test.ts`. It starts the real Node HTTP listener on an
ephemeral local port, uses a mocked no-payment x402 layer, and verifies listener-level `200` and
unpaid `402` response shape plus security headers. This now runs under `npm test`, so CI covers the
pre-deploy listener contract instead of relying only on imported handler tests and live curl checks.

### Closed - catalog drift prevention in web

Added `apps/web/src/lib/tenant-catalog-parity.test.ts`. Web still keeps a local catalog copy because
the current Vercel project root cannot import monorepo packages, but the test compares every
web-visible tenant field against `packages/core/src/tenant-catalog.ts`. Runtime/web price, status,
route, category, service, persona summary, refusal boundaries, and proof-field drift now fails the
workspace test suite.

### Closed - external dependency outage drills

Added `ops/outage-drills.md` and listener tests for non-paid outage classes: x402 facilitator
initialization failure, quote-store unavailability, expired `af_quote`, and mismatched `af_quote`.
Existing core/runtime tests cover Anthropic retry exhaustion and post-settlement ledger/archive
bookkeeping failures. The deployment runbook now requires these drills before buyer campaigns.

### Bounded - distributed ledger durability beyond shared-volume JSONL

Current journal locking is safe for one process or multiple processes writing the same persistent
volume through AgentForge's atomic filesystem lock. Production boot/readiness already requires
`AGENTFORGE_STORAGE_MODE` to declare `single-instance-jsonl` with one replica or `shared-volume-jsonl`
where every runtime process writes the same mounted persistent volume. True separate-volume or
ephemeral-container scaling remains intentionally out of scope for JSONL and requires a transactional
store with unique constraints on service call ID, ledger transaction ID, and payment transaction.

### Low - docs/public surfaces

Review judge/demo docs for stale counts after live ledger verification. Do not publish private audit-log entries.

## Production Verdict

Conditionally ready for controlled production traffic after deployment `0a95b690-efed-43db-b002-382acff78634`.

Live no-payment verification passed on 2026-07-16:

- `/health` returned 200 with security headers.
- `/ready` returned 200 with all checks green.
- `/svc/forge` returned unpaid 402 with top-level `outputSchema`.
- The advertised Forge `outputSchema.exampleRequestBody` was accepted by preflight.
- Malformed Forge preflight input was rejected before payment.
- `/ledger/summary` returned the runtime JSONL ledger journal.

Not yet "unconditionally production ready" for arbitrary scaling because separate-volume distributed ledger durability, preview-framework monitoring, and listener-level mocked x402 CI remain open.
