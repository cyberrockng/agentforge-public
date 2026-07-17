# Postgres Ledger Operations

## Production Mode

Production ledger writes should use:

- `AGENTFORGE_STORAGE_MODE=postgres`
- `DATABASE_URL` set as a protected platform secret or Railway service reference
- `AGENTFORGE_DATABASE_SSL_MODE=require` when using Railway-managed Postgres

Do not commit or print raw database URLs, passwords, or dump files.

## One-Time JSONL Backfill

Run the backfill inside the runtime service so it can access both the mounted
JSONL volume and the private Railway Postgres connection string:

```bash
railway ssh --service agentforge-runtime --environment production -- \
  node packages/payments/scripts/ledger-postgres.mjs backfill \
  --path /data/agentforge/service-ledger.jsonl
```

Reconcile source JSONL against Postgres:

```bash
railway ssh --service agentforge-runtime --environment production -- \
  node packages/payments/scripts/ledger-postgres.mjs reconcile \
  --path /data/agentforge/service-ledger.jsonl
```

Expected result:

- `ok: true`
- `missingKeys: []`
- `conflictingKeys: []`
- `duplicateRecordsIgnored` may be greater than zero for legacy duplicate quote rows

## Export

Export the current Postgres ledger to a private JSONL file:

```bash
railway ssh --service agentforge-runtime --environment production -- \
  node packages/payments/scripts/ledger-postgres.mjs export \
  --output /data/agentforge/postgres-ledger-export.jsonl
```

Keep exported ledgers private. They may contain payment transaction references,
buyer wallet addresses, and operational metadata.

## Backup And Restore

Minimum practical backup:

- Schedule the `ledger:postgres export` command to write a private JSONL snapshot.
- Store snapshots in a private bucket or encrypted operator storage.
- Keep at least daily snapshots during active sales periods.

Database-native backup:

- Use Railway Postgres backups when available for the managed database.
- For manual dumps, connect through Railway and run `pg_dump` from a trusted
  operator machine. Do not paste dump output into chat or public logs.

Restore sequence:

1. Stop paid traffic or temporarily return `/ready` to non-200 by rolling back env.
2. Restore the Railway Postgres backup or create a fresh managed Postgres service.
3. Set runtime `DATABASE_URL` to the restored database reference.
4. Run `node packages/payments/scripts/ledger-postgres.mjs ready` through
   `railway ssh`.
5. Run `node packages/payments/scripts/ledger-postgres.mjs reconcile --path <last-private-jsonl-snapshot>`
   through `railway ssh`.
6. Redeploy runtime and verify `/ready`, `/ledger/summary`, and `npm run verify:runtime`.

## Alerts

Configure an external monitor or cron to run:

```bash
npm run alert:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Alert when:

- `/ready` is not HTTP 200.
- `/ready` does not include `ledger_database: ok`.
- `/ledger/summary` is not HTTP 200.
- Runtime logs contain `ledger persistence failed after settlement`.
- Runtime logs contain Postgres connection, timeout, or uniqueness errors.

## Rollback

If the Postgres ledger becomes unavailable:

1. Set `AGENTFORGE_STORAGE_MODE=shared-volume-jsonl` or
   `AGENTFORGE_STORAGE_MODE=single-instance-jsonl` with
   `AGENTFORGE_RUNTIME_REPLICA_COUNT=1`.
2. Redeploy the last known-good runtime image.
3. Verify `/ready` reports `ledger_journal_dir: ok`.
4. Reconcile any paid calls created during the incident before switching back to Postgres.
