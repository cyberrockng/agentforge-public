# T-I/T-J Public proof log + judge bundle · 2026-07-14

Status: DONE.

## Scope

User requested T-J Judge bundle page.

T-J depends on a public proof-log link, so this pass delivered both:

- `/proof-log` — public-facing dated proof entries, outcome-only.
- `/judges` — one public judge bundle route for M2 form/demo use.

No wallet, payment, contract, OKX listing edit, OKX identity command, X/Twitter API call, Google form action, or `onchainos` command was run.

## Delivered

Code:

- Added `apps/web/src/lib/proof-log.ts`.
- Added `apps/web/src/lib/judge-bundle.ts`.
- Added `apps/web/src/lib/judge-bundle.test.ts`.
- Added `apps/web/src/app/proof-log/page.tsx`.
- Added `apps/web/src/app/judges/page.tsx`.
- Linked `/judges` and `/proof-log` from the home page.
- Linked `/judges` from `/launch-engine`.
- Backfilled proof-log entries for every date from `2026-07-06` through `2026-07-14`. Quiet days are explicitly labeled as no-new-public-proof days instead of being rewritten as wins.

Ops:

- Added T-I and T-J rows to `ops/status.md`.
- Marked T-I and T-J checked in `ops/master-plan-v2.md`.

## Public page boundaries

The public pages include:

- listing context for AgentForge `#3746`;
- delisting recovery narrative by date;
- real First Heartbeat payment tx;
- receipt samples for AgentForge, ShieldCheck, and Launch Kit;
- Guild, dashboard, proof-log, launch-engine, and verifier links;
- founder launch-post handoff status;
- explicit do-not-claim rules.

The public pages do **not** link:

- `ops/` files;
- internal planning docs;
- audit-log entries;
- master-plan sections;
- implementation mechanics.

## Truth constraints preserved

- External founders remain `0`.
- G2 did not pass; fallback is active.
- Verified cross-test reviews remain `0`.
- Launch Kit is heartbeat-stage / soft-launch transition pending, not public-callable.
- Launch Kit's receipt remains anchor-pending.
- Founder launch posts are drafts only; no X post was published by Codex.
- OKX listing visibility should be manually rechecked by the operator before final M2 submission after the Jul 14 price edits.
- The proof log discloses the Jul 8-Jul 12 public-proof gap instead of claiming receipts, anchors, reviews, or founder go-lives that did not happen.

## Validation

Local validation:

- `npm test` — PASS.
  - core: 46 tests.
  - payments: 24 tests.
  - provenance: 8 tests.
  - runtime: 18 tests.
  - web: 30 tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.
  - Build output includes `/judges` as dynamic route.
  - Build output includes `/proof-log` as static route.

Live verification checklist satisfied after deploy:

- `/judges` returns HTTP `200`;
- `/proof-log` returns HTTP `200`;
- `/judges` contains `AgentForge M2 judge bundle`, `#3746`, `psr_forge_b8f8787c7c13`, `psr_shieldcheck_642e7372000a`, `psr_launch-kit_3b103d9976a5`, `external founders remain 0`, and no internal `ops/` links;
- `/proof-log` contains `Public proof log`, `First Heartbeat payment tx`, `ShieldCheck heartbeat receipt`, `Launch Kit receipt`, and no internal `ops/` links.

## Deployment

Vercel production:

- Deployment: `dpl_FaVSKtrNH1BfzFUUX7szp21G3et5`.
- Deployment URL: `https://web-6cr3p63zv-cyberrockng-s-projects.vercel.app`.
- Stable public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`.
- State: `READY`.
- Note: the raw deployment URL redirects through Vercel login/protection in this project; the stable alias is public and returned HTTP `200`.

Live verification against stable alias:

- `/judges` returned HTTP `200`.
- `/proof-log` returned HTTP `200`.
- `/` returned HTTP `200` and links `/judges` + `/proof-log`.
- `/launch-engine` returned HTTP `200` and links `/judges`.
- `/judges` contains:
  - `AgentForge M2 judge bundle`;
  - `#3746`;
  - `psr_forge_b8f8787c7c13`;
  - `psr_shieldcheck_642e7372000a`;
  - `psr_launch-kit_3b103d9976a5`;
  - `external founders remain 0`;
  - `1.850000 USDT`;
  - `0.320000 USDT`;
  - `Anchor pending`;
  - no `ops/`, `audit-log`, or `master-plan` strings.
- `/proof-log` contains:
  - `Public proof log`;
  - `2026-07-06`;
  - `2026-07-08`;
  - `First Heartbeat payment tx`;
  - `ShieldCheck heartbeat receipt`;
  - `Launch Kit receipt`;
  - `No new public proof recorded`;
  - no `ops/`, `audit-log`, or `master-plan` strings.
