# Postgres Ledger Backfill And Ops Tooling - 2026-07-17

Status: DONE.

## Scope

- Added repeatable Postgres ledger admin tooling:
  - `ledger-postgres.mjs ready`
  - `ledger-postgres.mjs backfill`
  - `ledger-postgres.mjs reconcile`
  - `ledger-postgres.mjs export`
- Added `npm run alert:runtime` for production readiness and ledger-summary alert checks.
- Added `ops/postgres-ledger-operations.md` with migration, export, backup, restore,
  alerting, and rollback procedures.
- Included the payment ledger scripts in the runtime Docker image so migration can
  run inside Railway with access to the private database URL and mounted volume.

## Validation Before Deploy

Ran:

```bash
npm run verify:release
```

Result:

- `npm test` passed: 35 test files, 213 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm audit --omit=dev` reported 0 vulnerabilities.

## Deployment

Deployed migration tooling:

- Railway deployment ID: `bd565ba2-c52a-4a0a-a411-6217b72b7082`
- Status: `SUCCESS`
- Image digest: `sha256:7bc1656dc7d61d4428c9f2d30caddc3670c9507a28aaefb5ac8a3baccde22166`

Deployed reconciliation comparison fix:

- Railway deployment ID: `e53bea14-0cb5-49ec-8dfc-072d0538ad7a`
- Status: `SUCCESS`
- Image digest: `sha256:e1a563f73324682842a330a2142954923865bc5c0cf2ef9da5918b96608d0b28`

## Backfill

Backfilled the volume-backed runtime JSONL ledger:

- Source path: `/data/agentforge/service-ledger.jsonl`
- Source records: `41`
- Compacted source records: `36`
- Exact duplicate legacy quote records ignored: `5`
- Delivered service calls: `10`
- Ledger transactions: `10`
- Balance: `4050000` debit / `4050000` credit atomic USDT

The packaged seed ledger overlapped ShieldCheck and Launch Kit records already
present in the volume ledger, so only the missing First Heartbeat pair was
backfilled from the seed ledger:

- Seed-only records inserted: `2`
- Additional delivered service calls: `1`
- Additional ledger transactions: `1`
- Additional balance: `1000000` debit / `1000000` credit atomic USDT

Final combined reconciliation:

- Combined source records: `43`
- Compacted combined records: `38`
- Postgres records: `38`
- Missing keys: `[]`
- Conflicting keys: `[]`
- Delivered service calls: `11`
- Ledger transactions: `11`
- Balance: `5050000` debit / `5050000` credit atomic USDT

## Export

Created private Postgres ledger export:

- Output path: `/data/agentforge/postgres-ledger-export.jsonl`
- Exported records: `38`
- Check: `ok`

The export remains private on the Railway volume and was not committed.

## Live Verification

Ran after migration:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
npm run alert:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Result:

- `/health` passed with security headers.
- `/ready` passed.
- `/ready` includes `ledger_database: ok`.
- `/svc/forge/info` passed.
- unpaid `/svc/forge` 402 challenge includes truthful `outputSchema`.
- advertised output schema example is accepted by preflight.
- malformed Forge body is rejected before payment.
- `/ledger/summary` is readable.

Post-migration live ledger summary:

- Paid calls: `11`
- Settled atomic USDT: `5050000`
- Forge revenue atomic USDT: `4730000`
- Founder payable atomic USDT: `320000`
- Referral payable atomic USDT: `0`

No paid production smoke was run in this pass; paid proofs still require explicit
human approval for spending funds.
