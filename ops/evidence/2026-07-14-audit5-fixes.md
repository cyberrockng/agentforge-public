# AUDIT-5 fix bundle · 2026-07-14

Status: DONE.

## Scope

Fixes addressed from the private AUDIT-5 verdict:

1. Catalog status changes must be checked against launch-ladder evidence.
2. Web template gallery must not silently drift from core templates.
3. G2 status row must match the already-recorded fallback ruling.
4. `ledger:check` should report a clear missing-journal message at the default path.

No listing-price change was made. Pricing remains frozen for M2 unless the user explicitly reopens it.

## Implementation

### Status machine / tenant catalog

- Moved the status transition guard into `packages/core/src/status-machine.ts`.
- Kept `assertStatusTransition` exported from `@agentforge/core`.
- Added `assertTenantCatalogEntryStatusEvidence()` in `packages/core/src/tenant-catalog.ts`.
- Tenant catalog reads now validate visible status against evidence:
  - `gated` requires Forge Gate report evidence;
  - `heartbeat` requires Forge Gate report + real heartbeat payment evidence;
  - `softlaunch` requires heartbeat evidence + birth-certificate evidence;
  - `public` requires public listing evidence.
- Added Launch Kit live Forge Gate evidence:
  - report id `fg_live_feb7a059bc064c78`;
  - evidence `ops/evidence/2026-07-14-launch-kit-forge-gate-live-pass.md`.
- Corrected Launch Kit from `softlaunch` to `heartbeat` because it has live gate + paid heartbeat evidence but no birth certificate / soft-launch transition proof.
- Runtime x402 route generation now excludes Launch Kit until it clears the next proof rung.
- Web storefront/Guild/dashboard/launch-engine copy now labels Launch Kit as heartbeat-stage / soft-launch transition pending.

### Template gallery drift

- Kept `apps/web/src/lib/templates.ts` self-contained so the existing Vercel app-only build context can deploy.
- Added a core cross-workspace test that checks web gallery IDs, titles, categories, summaries, buyer inputs, output formats, boundaries, and display prices against the core registry.
- Added a core cross-workspace test that checks the web storefront tenant catalog against core tenant status/evidence fields.

### G2 status row

- Updated `ops/status.md` so G2 is no longer `TODO`.
- G2 now points at the existing `ops/decisions.md#g2` ruling and is marked as fallback-ruled.
- Updated `AUDIT-6` to `SKIPPED(g2-fallback-ruled)` because G2 failed and the fallback already determines the M2 path.
- Updated `T7.1` dependencies so T6.2 no longer blocks M2 after the fallback ruling.

### Ledger check message

- Updated `packages/payments/scripts/ledger-check.mjs` so a missing default journal reports:
  - `journal not found at /data/agentforge/service-ledger.jsonl`.

## Validation

- Launch Kit live Forge Gate: PASS.
  - `fg_live_feb7a059bc064c78`;
  - score `100`;
  - 18 probes;
  - 0 findings.
- `npm test` — PASS.
  - core: 8 files, 46 tests.
  - payments: 2 files, 24 tests.
  - provenance: 1 file, 8 tests.
  - runtime: 3 files, 18 tests.
  - web: 6 files, 28 tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.
- `npm run ledger:check` with no local `/data` journal — expected FAIL with clear message:
  - `journal not found at /data/agentforge/service-ledger.jsonl`.

## Boundary

- No wallet, payment, contract, OKX listing, OKX identity, X/Twitter API, or `onchainos` command was run.
- No price was changed.
- No review, founder, customer, revenue, approval, or public-launch claim was invented.

## Production note

Because this changes visible/runtime status, Railway and Vercel production deploys are required before the fix is fully live.

Vercel deployment note:

- First Vercel production redeploy attempt after `d0cc93b` failed because production web code imported `@agentforge/core` while the linked Vercel project builds from the `apps/web` context.
- Fix: keep production web code self-contained and move core/web parity checks into the core test suite, where the full monorepo is available.
- Local validation after the correction is green.

## Production deployment and live verification

Railway runtime:

- Deployment: `c339d63c-5545-4cc5-a3bc-e1ae62c0df9f`.
- Status: SUCCESS.
- URL: `https://agentforge-runtime-production-9a4d.up.railway.app`.

Vercel web:

- Successful deployment: `dpl_DZ5J1TVhA8rMUk2XJ4dCgU5FtqXx`.
- Deployment URL: `https://web-iiiax8fx6-cyberrockng-s-projects.vercel.app`.
- Stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`.
- State: READY.

Live verification:

- Runtime `/health`: HTTP `200`.
- Runtime `GET /svc/launch-kit`: HTTP `200`; `tenant.status: "heartbeat"`; price remains `0.45 USDT`; knowledge facts state Launch Kit remains heartbeat-stage until soft-launch transition proof.
- Runtime `GET /mcp/launch-kit`: HTTP `200`; `status: "heartbeat"`.
- Runtime `POST /svc/launch-kit`: HTTP `409`; `error: "service_not_callable_yet"`; `status: "heartbeat"`; next gate says birth-certificate and soft-launch evidence are required before public paid calls.
- Runtime `GET /svc/shieldcheck`: HTTP `200`; `tenant.status: "softlaunch"` unchanged.
- Runtime `/ledger/summary`: HTTP `200`; Launch Kit row shows `Paid heartbeat complete; soft-launch transition pending`.
- Web `/a/launch-kit`: HTTP `200`; shows `Heartbeat`, `Paid heartbeat complete; soft-launch transition pending`, and public paid calls closed.
- Web `/guild`: HTTP `200`; includes Launch Kit with `Heartbeat` status.
- Web `/dashboard`: HTTP `200`; shows Launch Kit `Paid heartbeat complete; soft-launch transition pending`.
- Web `/launch-engine`: HTTP `200`; Launch Kit draft says `Soft-launch transition still pending`.
- Web `/templates`: HTTP `200`; still shows `Launch Kit-derived`.
