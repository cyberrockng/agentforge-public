# AgentForge Deployment, Rollback, And Operations Runbook

## Pre-Deploy Checklist

- Confirm no private audit-log entries are included in public surfaces or commits.
- Run:
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `git diff --check`
- Run the non-paid outage drill suite in `ops/outage-drills.md` before buyer campaigns.
- Confirm production env has:
  - `ANTHROPIC_API_KEY`
  - `OKX_X402_API_KEY` or `OKX_API_KEY`
  - `OKX_X402_SECRET_KEY` or `OKX_SECRET_KEY`
  - `OKX_X402_PASSPHRASE` or `OKX_PASSPHRASE`
  - `AGENTFORGE_SETTLEMENT_ADDRESS` set to the X Layer EVM settlement wallet
  - `AGENTFORGE_STORAGE_MODE=postgres` with `DATABASE_URL`, or `AGENTFORGE_STORAGE_MODE=single-instance-jsonl` with `AGENTFORGE_RUNTIME_REPLICA_COUNT=1`, or `AGENTFORGE_STORAGE_MODE=shared-volume-jsonl` when every runtime process writes the same mounted persistent volume
  - writable `AGENTFORGE_LEDGER_PATH` directory only when a JSONL storage mode is selected
  - writable `AGENTFORGE_DELIVERY_ARCHIVE_DIR`
  - writable `AGENTFORGE_PAYMENT_QUOTE_DIR`
- Set `AGENTFORGE_TRUSTED_CLIENT_IP_HEADER` to the sanitized platform header if needed.

## Post-Deploy Checks

- `GET /health` returns 200 and current hardening status.
- `GET /ready` returns 200 with all checks green.
- In Postgres mode, `/ready` includes `ledger_database: ok`; in JSONL mode, it includes `ledger_journal_dir: ok`.
- `GET /svc/forge` returns 402 with x402 `accepts` and top-level `outputSchema`.
- `GET /svc/forge/info` returns service info without payment.
- `POST /svc/forge/preflight` with a valid body returns `bodyReadyForPayment: true` and a quote-bound paid endpoint.
- `GET /ledger/summary` returns current ledger summary without integrity errors.
- Run the no-payment contract gate:
  - `npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app`
- Confirm the automated listener-level 200/402 contract test passed in CI (`server-listener.test.ts`).

Do not run paid production proofs or spend funds without explicit human approval.

## Rollback Conditions

Rollback immediately if:

- `/ready` returns 503 in production after env/path correction.
- x402 challenges stop returning 402 for callable service routes.
- valid preflight bodies fail before quote creation.
- `npm run verify:runtime -- <production-url>` fails on health, readiness, security headers, `outputSchema`, valid preflight, or malformed-body rejection.
- any settled paid call returns non-2xx without a deliverable.
- ledger integrity check reports duplicate delivered payment refs or unbalanced transactions.
- logs show secret leakage in request/response/error output.

Rollback target:

- previous Railway runtime deployment known to pass `/health`, `/svc/forge`, `/svc/forge/preflight`, unpaid 402, and `/ledger/summary`.

## Incident Triage

1. Capture timestamp, route, tenant, job ID if any, payment transaction if any, and correlation from logs.
2. Determine whether settlement occurred.
3. If no settlement occurred, tell the buyer to retry from preflight with a fresh quote.
4. If settlement occurred and no deliverable was visible, use recovery with `paymentTransaction` plus exact original body.
5. If recovery fails but payment settled, follow `ops/customer-support-sla.md`: provide manual make-good delivery or agree-refund within the stated response targets.
6. Add a regression test for the failure class before declaring fixed.

## Operational Alerts To Add

- `/ready` non-200.
- ledger append failure after settlement.
- delivery archive failure after settlement.
- Anthropic retry exhaustion.
- x402 settlement failure rate spike.
- rate-limit bucket cap evictions above normal baseline.
- ledger integrity check failure.
- `AGENTFORGE_SETTLEMENT_ADDRESS` mismatch between runtime env and expected settlement wallet.
