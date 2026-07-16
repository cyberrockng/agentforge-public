# AUDIT-4 fixes · ledger and verifier hardening

Date: 2026-07-14  
Builder: Codex

## Scope

This fix pass addresses AUDIT-4 findings that can be fixed in code without wallet/payment execution:

- duplicate payment-reference rejection in ledger journal append;
- `ledger:check` command and tamper detection;
- 500 paid-call ledger property coverage;
- dashboard/Guild reads from live runtime journal summary instead of hand-copied web snapshot;
- unknown `/verify/:id` returns 404;
- public verifier pages disclose superseded anchors.

## Ledger journal integrity

Implemented in `@agentforge/payments`:

- `checkLedgerJournal(records)`
- `assertLedgerJournalIntegrity(records)`
- append-time validation in `appendLedgerJournal(path, records)`

Rules enforced:

- one delivered `service_call` per `paymentTransaction`;
- one `ledger_transaction` per `metadata.paymentTransaction`;
- duplicate `service_call.id` and `ledger_transaction.id` rejected;
- delivered service calls must have payment and ledger refs;
- ledger transactions must balance per currency;
- ledger transaction payment refs must match their service call.

## `ledger:check`

Command:

```bash
npm run ledger:check -- --path ops/evidence/2026-07-13-t32-service-ledger.jsonl
```

Verified output:

```json
{
  "ok": true,
  "serviceCallCount": 1,
  "deliveredServiceCallCount": 1,
  "ledgerTransactionCount": 1,
  "balances": {
    "USDT": {
      "debitAtomic": "1000000",
      "creditAtomic": "1000000"
    }
  }
}
```

## Runtime summary

New public runtime endpoint:

- `GET /ledger/summary`

Behavior:

- reads the live JSONL journal from `AGENTFORGE_LEDGER_PATH` or `/data/agentforge/service-ledger.jsonl`;
- merges in the committed First Heartbeat seed journal when the live journal does not already contain those record IDs;
- fails closed with `503 ledger_summary_unavailable` if the merged journal fails integrity checks.

Seed journal:

- `ops/evidence/2026-07-13-t32-service-ledger.jsonl`

## Web dashboard/Guild

Changed:

- `/dashboard` is dynamic and reads runtime `/ledger/summary` first;
- `/guild` is dynamic and uses the same dashboard summary path;
- both fall back to the committed JSONL seed journal if runtime is unavailable.

This removes the old hand-copied dashboard arrays as the source of truth.

## Verifier hardening

Changed:

- unknown `/verify/:id` now calls Next `notFound()` and returns 404;
- each verifier record now includes any superseded anchors;
- public verifier pages render a "Disclosed superseded anchors" section.

## Production storage boundary

Code now defaults to `/data/agentforge/service-ledger.jsonl` instead of `/tmp/agentforge/service-ledger.jsonl`.

Read-only Railway check:

```bash
railway volume list --json
```

Result:

```json
{ "volumes": [] }
```

No Railway volume was created in this pass. Creating a persistent volume is an infrastructure resource change and requires explicit user approval. Before the next paid call, approve:

```bash
railway volume add --service agentforge-runtime --mount-path /data
railway up --detach --service agentforge-runtime --environment production
```

## Validation

- `npm test --workspace @agentforge/payments`
- `npm run typecheck --workspace @agentforge/payments`
- `npm test --workspace @agentforge/runtime`
- `npm run typecheck --workspace @agentforge/runtime`
- `npm test --workspace @agentforge/web`
- `npm run typecheck --workspace @agentforge/web`
- `npm run ledger:check -- --path ops/evidence/2026-07-13-t32-service-ledger.jsonl`
