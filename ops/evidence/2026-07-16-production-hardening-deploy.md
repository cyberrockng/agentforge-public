# 2026-07-16 Production Hardening Deployment

## Source

- Commit: `9842aee` (`[hardening] production runtime reliability pass`)
- Branch: `main`
- Pushed to `origin/main`

## Railway Runtime

- Service: `agentforge-runtime`
- Public URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Deployment: `0a95b690-efed-43db-b002-382acff78634`
- Status: `SUCCESS`
- Previous deployment: `c73785c7-7da0-444e-a3d5-982fcde72e25`
- Volume: `agentforge-runtime-volume` mounted at `/data`

## Production Env Added

- `AGENTFORGE_STORAGE_MODE=single-instance-jsonl`
- `AGENTFORGE_RUNTIME_REPLICA_COUNT=1`

No secrets are recorded here.

## Local Verification Before Deploy

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.
- `npm audit --omit=dev` still reports the known moderate Next/PostCSS advisory. The forced fix path proposes an unsafe downgrade to `next@9.3.3`, so it was not applied.

## Live No-Payment Verification

Command:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Result:

- `PASS /health returns runtime liveness with security headers`
- `PASS /ready returns production readiness`
- `PASS /svc/forge/info returns buyer-facing service info`
- `PASS /svc/forge unpaid challenge includes truthful outputSchema`
- `PASS advertised outputSchema example is accepted by preflight`
- `PASS malformed Forge body is rejected before payment`

## Additional Live Smoke Checks

- `GET /health` returned `200` with security headers and status `production-hardening-2026-07-16`.
- `GET /ready` returned `ok: true`; failed checks list was empty.
- `GET /ledger/summary` returned:
  - `paidCalls: 11`
  - `settledAtomic: "5050000"`
  - `forgeRevenueAtomic: "4730000"`
  - `founderPayableAtomic: "320000"`
  - `referralPayableAtomic: "0"`
  - `source: "Runtime JSONL ledger journal"`

## Recent HTTP Error Log Review

Recent 4xx logs after deployment were expected verification traffic only:

- unpaid `GET /svc/forge` -> `402`
- malformed `POST /svc/forge/preflight` -> `400`
- accidental `HEAD /health` -> `404` because the runtime implements `GET /health`, not HEAD.

## Boundary

- No paid proof was run.
- No wallet transfer, settlement, anchor, public review, listing edit, X/Twitter post, or Google form action was performed.
