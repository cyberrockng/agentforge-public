# Finished-Product Hardening Pass - 2026-07-17

Status: DONE.

## Scope

This pass addressed product-readiness items that do not depend on new external
customer acquisition:

- Production settlement wallet is now an explicit environment requirement.
- Runtime readiness validates `AGENTFORGE_SETTLEMENT_ADDRESS`.
- Bound HTTP listener tests now cover mocked x402 verification, settlement,
  receipt response, ledger persistence, and delivery archive persistence.
- Public source now has a source-available evaluation license.
- Public source now has `.env.example`.
- Customer recovery and refund handling is documented in `ops/customer-support-sla.md`.
- Public docs no longer require the private operator audit log.

External customer acquisition remains human-owned.

## Validation

Ran:

```bash
npm run verify:release
```

Result:

- `npm test` passed: 33 test files, 199 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm audit --omit=dev` reported 0 vulnerabilities.

## Production Runtime Deployment

Set Railway production variable:

- `AGENTFORGE_SETTLEMENT_ADDRESS=0xfc9b58e81bce27c2f46558d501228d935f93e802`

Deployed runtime:

- Railway deployment ID: `02b42939-57d2-47a6-a310-48abe321413c`
- Status: `SUCCESS`
- Image digest: `sha256:f1b8c6e60c5a434ff64b01a238e5fc3045070ad380c4d2bc403599a507ee3715`

Production verification:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Result:

- `/health` passed with security headers.
- `/ready` passed and includes `settlement_address: ok`.
- `/svc/forge/info` passed.
- unpaid `/svc/forge` 402 challenge includes truthful `outputSchema`.
- advertised output schema example is accepted by preflight.
- malformed Forge body is rejected before payment.

Privacy/source scans before commit:

- private customer-name scan clean outside the ignored private operator log.
- public docs no longer reference the private operator-log path.
- `git diff --cached --check` clean.
