# T1.4 Live Forge Gate probe harness fix

Date: 2026-07-13

## What changed

AUDIT-1 found that the original T1.4 gate was a static AgentSpec linter, not a live probe harness.
This fix adds the missing live harness while keeping the old static linter available for draft-spec
prechecks.

Implemented:

- `runLiveForgeGate` in `packages/core/src/forge-gate.ts`.
- Default probe set covering:
  - 5 scope probes,
  - 5 refusal probes,
  - 3 hallucination probes,
  - 2 output-format probes,
  - three security-injection probes: prompt extraction, role override, and tenant crossing.
- The live runner enforces these minimum counts even when a custom probe list is supplied.
- Endpoint hardening: live probes refuse localhost, loopback, private-network, and non-HTTPS endpoints
  by default.
- Transcript/report output with 0–100 scoring and pass/fail status.
- Runtime endpoint `POST /internal/forge-gate-live/:tenant` to run and persist live reports.
- Zero-priced QA call path on the real service route `POST /svc/:tenant`, enabled only with:
  - `Authorization: Bearer <AGENTFORGE_QA_TOKEN>`,
  - `x-agentforge-qa: forge-gate-live`,
  - QA body declaring `harness:"forge-gate-live"` and `zeroPriced:true`.
- Reports persist to `AGENTFORGE_FORGE_GATE_REPORT_DIR` or `/tmp/agentforge/forge-gate-reports`.

## Boundary

- This is not a wallet, payment, listing, or deployment action.
- Normal paid calls still go through x402.
- The QA path does not record ledger revenue, does not verify payment, and does not settle payment.
- Local smoke used `allowLocalEndpoint:true`; production default still rejects local/private endpoints.
- T1.4 is marked DONE only after the production HTTPS report below.

## Local smoke

Command shape:

```bash
PORT=4011 HOST=127.0.0.1 AGENTFORGE_INTERNAL_TOKEN=t14-smoke AGENTFORGE_QA_TOKEN=t14-smoke \
  AGENTFORGE_FORGE_GATE_REPORT_DIR=/tmp/agentforge-t14-smoke node apps/runtime/dist/server.js

curl -sS -X POST http://127.0.0.1:4011/internal/forge-gate-live/forge \
  -H 'authorization: Bearer t14-smoke' \
  -H 'content-type: application/json' \
  --data '{"endpoint":"http://127.0.0.1:4011/svc/forge","allowLocalEndpoint":true}'
```

Observed result:

```json
{
  "tenant": "forge",
  "blockedFromPublic": false,
  "reportId": "fg_live_5a587331c0294c66",
  "passed": true,
  "score": 100,
  "probes": 18,
  "categories": {
    "scope": 5,
    "refusal": 5,
    "hallucination": 3,
    "format": 2,
    "security_injection": 3
  },
  "reportPath": "/tmp/agentforge-t14-smoke/2026-07-13T15_09_32.363Z-forge-fg_live_5a587331c0294c66.json",
  "findings": []
}
```

The persisted local report contained 18 transcripts and confirmed the harness targeted
`http://127.0.0.1:4011/svc/forge` through the service route.

## Validation

- `npm test` — PASS.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.

## Production deploy and live report

Approved by user on 2026-07-13.

Runtime:

- Railway URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Final deployment: `64073080-ff06-4d6a-bd8e-b5436ee0b35b`
- Builder: Dockerfile, `apps/runtime/Dockerfile`
- Note: `RAILWAY_DOCKERFILE_PATH=apps/runtime/Dockerfile` was set on the Railway service to force the intended Dockerfile path. No secret variables were printed or changed.

Web:

- Vercel production deployment: `dpl_EdRGEiS8NtfZcASxR2JCCMfJeJ32`
- Production URL: `https://web-2r3auv0k1-cyberrockng-s-projects.vercel.app`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`

Live runtime verification:

```json
{
  "svcShieldCheckStatus": "gated",
  "mcpShieldCheckStatus": "gated",
  "shieldCheckPostGuard": "service_not_callable_yet"
}
```

Live web verification:

- `/a/shieldcheck` returned HTTP 200 and rendered `Born from AgentForge proof; own heartbeat pending`.
- `/a/shieldcheck` did not render the stale `This service has a real paid heartbeat` claim.
- `/dashboard` returned HTTP 200 and rendered ledger-backed totals:
  - paid calls: `1`,
  - settled: `1.000000 USDT`,
  - Forge revenue: `1.000000 USDT`,
  - founder payable: `0.000000 USDT`,
  - ShieldCheck: `0.000000 USDT` and own heartbeat pending.

Production Forge Gate report:

```json
{
  "tenant": "forge",
  "endpoint": "https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge",
  "blockedFromPublic": false,
  "reportId": "fg_live_b7d88983da5ed16c",
  "passed": true,
  "score": 100,
  "probes": 18,
  "categories": {
    "scope": 5,
    "refusal": 5,
    "hallucination": 3,
    "format": 2,
    "security_injection": 3
  },
  "findings": [],
  "reportPath": "/tmp/agentforge/forge-gate-reports/2026-07-13T15_24_51.381Z-forge-fg_live_b7d88983da5ed16c.json"
}
```

## Remaining work

- Re-run AUDIT-1/AUDIT-3 follow-up checks.
