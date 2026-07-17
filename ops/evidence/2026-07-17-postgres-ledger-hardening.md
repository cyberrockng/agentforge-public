# Postgres Ledger Hardening - 2026-07-17

Status: DONE for code, tests, docs, release verification, and runtime deployment.

## Scope

- Added a Postgres-backed ledger journal adapter in `@agentforge/payments`.
- Preserved JSONL ledger modes for local, single-instance, and same-volume fallback operation.
- Added production readiness validation for `AGENTFORGE_STORAGE_MODE=postgres` plus `DATABASE_URL`.
- Wired runtime paid-delivery persistence, ledger summary, and recovery ledger reads to use the selected storage mode.
- Documented Postgres as the recommended production ledger mode without committing any database secret.

## Database Ledger Controls

- Creates `agentforge_ledger_journal` automatically if missing.
- Stores immutable journal payloads in `record_json` with queryable metadata columns.
- Enforces unique journal keys, service call IDs, ledger transaction IDs, and payment transaction references.
- Serializes append integrity checks and inserts with a Postgres transaction plus advisory lock.
- Treats exact already-stored retry records as idempotent no-ops, while rejecting conflicting reused keys.

## Validation

Ran:

```bash
npm run verify:release
git diff --check
```

Result:

- `npm test` passed: 35 test files, 213 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm audit --omit=dev` reported 0 vulnerabilities.
- `git diff --check` passed.

## Runtime Deployment

Deployed runtime support without changing production storage mode:

- Railway deployment ID: `a3167be9-a17a-4908-985d-a47c4937b906`
- Status: `SUCCESS`
- Image digest: `sha256:3e43d9a08917c89969800ec6a8b274b8ddf9bd82d3283c47e9ad8bcb03c21a79`

Production verification:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Result:

- `/health` passed with security headers.
- `/ready` passed.
- `/svc/forge/info` passed.
- unpaid `/svc/forge` 402 challenge includes truthful `outputSchema`.
- advertised output schema example is accepted by preflight.
- malformed Forge body is rejected before payment.

Active production readiness still reports `ledger_journal_dir: ok`, because the live
runtime remains on the existing volume-backed JSONL ledger until a managed
Postgres `DATABASE_URL` is provisioned as a protected secret.

## Production Note

Switching the live runtime from JSONL to Postgres must be done only after a
managed Postgres database is provisioned and `DATABASE_URL` is set as a
protected platform secret. Do not commit or print the database URL.
