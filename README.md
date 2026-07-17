# AgentForge

AgentForge turns human expertise into live, verified, revenue-earning Agent Service Providers on OKX.AI.

## Current Status

Build execution follows `AgentForge-Executable-Buildbook.md`.

Start each session by reading:

- `AGENTS.md`
- `ops/status.md`
- `ops/lessons.md`

Private operational audit logs are intentionally excluded from the public source
snapshot. Publicly shareable hardening evidence lives under `ops/evidence/`,
`ops/decisions.md`, and `ops/lessons.md`.

## Production Hardening Docs

- Buyer x402/API contract: `ops/x402-buyer-api.md`
- Security architecture and threat model: `ops/security-architecture-threat-model.md`
- Deployment, rollback, and operations runbook: `ops/deployment-rollback-runbook.md`
- Postgres ledger migration, export, backup, and alerts: `ops/postgres-ledger-operations.md`
- Customer recovery and refund SLA: `ops/customer-support-sla.md`
- Latest hardening execution plan: `ops/plans/PRODUCTION_HARDENING_EXECUTION_2026-07-16.md`

## Public Source License

This repository is source-available for judging, due diligence, security review, and
internal evaluation. See `LICENSE` for the exact permitted use.

## Runtime Verification

After deploying the runtime, run the no-payment contract gate:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Production must declare storage topology with `AGENTFORGE_STORAGE_MODE`. Use
`postgres` with `DATABASE_URL` for the durable multi-replica ledger. Use
`single-instance-jsonl` only with `AGENTFORGE_RUNTIME_REPLICA_COUNT=1`; use
`shared-volume-jsonl` only when every runtime process writes the same mounted
persistent volume.

Production must also set `AGENTFORGE_SETTLEMENT_ADDRESS` to the X Layer EVM address
that receives x402 settlement. See `.env.example` for the full runtime env surface.
