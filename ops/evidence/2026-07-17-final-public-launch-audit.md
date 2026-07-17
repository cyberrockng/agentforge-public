# Final Public Launch Audit - 2026-07-17

Status: DONE.

## Scope

- Audited public-facing launch pages after the Postgres ledger cutover/backfill.
- Fixed runtime ledger summary source copy from JSONL-specific wording to
  `Runtime Postgres ledger journal` when Postgres mode is active.
- Fixed runtime/dashboard latest-call selection to use delivered timestamp rather
  than append/backfill order.
- Added the Postgres cutover/backfill entry to the public proof log and judge story.
- Updated the final launch pack with the clean public GitHub URL and latest
  deployment details.

## Current Public URLs

- Clean public GitHub source: `https://github.com/cyberrockng/agentforge-public`
- Judge bundle: `https://web-one-peach-2vp0hv3dr1.vercel.app/judges`
- Proof log: `https://web-one-peach-2vp0hv3dr1.vercel.app/proof-log`
- Dashboard: `https://web-one-peach-2vp0hv3dr1.vercel.app/dashboard`
- AgentForge service page: `https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge`
- Storefront: `https://web-one-peach-2vp0hv3dr1.vercel.app/forge`
- Buyer checkout: `https://web-one-peach-2vp0hv3dr1.vercel.app/hire`
- Launch handoff: `https://web-one-peach-2vp0hv3dr1.vercel.app/launch-engine`
- Runtime endpoint: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge`

## Deployments

Runtime:

- Railway deployment ID: `3398fd74-90e8-4d37-9a71-97dcbeeaf29d`
- Status: `SUCCESS`
- Image digest: `sha256:4a784c682e58a80970af9a084e3298719b5bfa012d66131ea3db96d8f4dcd874`

Web:

- Vercel deployment ID: `dpl_Cxi9gAL8oRyGqdZ8d1LmyjYaR13n`
- Deployment URL: `https://web-qcosmp1yk-cyberrockng-s-projects.vercel.app`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`

## Runtime Verification

Ran:

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

Live ledger summary:

- Source: `Runtime Postgres ledger journal`
- Paid calls: `11`
- Settled atomic USDT: `5050000`
- Latest delivered call: `sc_forge_79119a0dc8c9`
- Latest delivered at: `2026-07-16T05:04:39.353Z`

## Public Page Audit

Checked live public alias:

- `/judges`: HTTP 200, includes `Ledger-backed paid calls`, `11`,
  `5.050000 USDT`, and `Postgres-backed ledger cutover`.
- `/proof-log`: HTTP 200, includes `Postgres ledger cutover and backfill`,
  `Reconciled Postgres records: 38`, and `5.050000 USDT`.
- `/dashboard`: HTTP 200, includes `11`, `5.050000 USDT`, and
  `Runtime Postgres ledger journal`.
- `/forge`: HTTP 200.
- `/a/forge`: HTTP 200 and includes AgentForge service pricing.
- `/hire`: HTTP 200.
- `/launch-engine`: HTTP 200 and points to `/judges`.

## Remaining Human Steps

- Film the live demo.
- Publish the X post manually.
- Submit the Google form with demo URL, X URL, judge bundle URL, and public
  GitHub URL.
- Add final demo/X/form URLs to evidence after submission.

No paid smoke test was run in this pass.
