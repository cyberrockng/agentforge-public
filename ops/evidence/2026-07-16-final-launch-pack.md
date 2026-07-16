# AgentForge Final Launch Pack - Public-Safe Handoff

Date: 2026-07-16

## Scope

This pack prepares the final public launch/submission materials that Codex can safely prepare.
Human-owned actions remain outside this pack:

- film the live demo;
- publish the X post;
- submit the Google form;
- add final demo/X/form URLs back to evidence.

No wallet transfer, paid proof, listing edit, X/Twitter post, Google form submission, or customer
security disclosure was performed while preparing this pack.

## Public Links

- Judge bundle: `https://web-one-peach-2vp0hv3dr1.vercel.app/judges`
- AgentForge service page: `https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge`
- Storefront: `https://web-one-peach-2vp0hv3dr1.vercel.app/forge`
- Proof log: `https://web-one-peach-2vp0hv3dr1.vercel.app/proof-log`
- Dashboard: `https://web-one-peach-2vp0hv3dr1.vercel.app/dashboard`
- Guild: `https://web-one-peach-2vp0hv3dr1.vercel.app/guild`
- Launch handoff: `https://web-one-peach-2vp0hv3dr1.vercel.app/launch-engine`
- Buyer checkout: `https://web-one-peach-2vp0hv3dr1.vercel.app/hire`
- Runtime service route: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge`

## Web Deployment

- Vercel production deployment: `dpl_DbcrTqk2xwfqhKg3iZLfTN3xNqTV`
- Deployment URL: `https://web-70vaa7l3i-cyberrockng-s-projects.vercel.app`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Verified after deploy:
  - `/judges` returned HTTP 200 and rendered the submission handoff, X draft, buyer checkout link,
    and customer-confidentiality caveat.
  - `/proof-log` rendered the Jul 16 production-hardening/final-packaging entry.
  - `/launch-engine` rendered the AgentForge draft pointing to `/judges`.

## Live Runtime Snapshot

Verified by:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

Result:

- `/health` returned runtime liveness with security headers.
- `/ready` returned production readiness.
- `/svc/forge/info` returned buyer-facing service info.
- unpaid `/svc/forge` returned 402 with truthful top-level `outputSchema`.
- the advertised Forge example request body was accepted by preflight.
- malformed Forge body was rejected before payment.

Live ledger snapshot from `GET /ledger/summary` at packaging time:

- paid calls: `11`
- settled: `5.050000 USDT`
- Forge revenue net: `4.730000 USDT`
- founder payable: `0.320000 USDT`
- latest delivered call: `sc_forge_79119a0dc8c9`
- latest payment tx: `0x79119a0dc8c9df644ab5c24a4dd5dad3381aa2c6138dbc30fc8e1dfd4b0d1e3f`

These numbers are a point-in-time ledger snapshot, not a promise about future traffic.

## X Post Draft

Prepared for manual human posting only:

```text
AgentForge turns human expertise into live, paid OKX.AI agent services.

Live: ASP #3746, x402 payments, ledger-backed receipts, recovery hardening, verifier pages, and a public judge bundle.

https://web-one-peach-2vp0hv3dr1.vercel.app/judges
#OKXAI
```

Character count: `250`.

## Google Form Notes

Use these only after the live demo is filmed:

- Project name: `AgentForge`
- Short description: `AgentForge turns human expertise into live, paid OKX.AI agent services with x402 payments, ledger-backed receipts, verifier pages, recovery hardening, and honest launch-ladder evidence.`
- Public judge/evidence URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/judges`
- Public service URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge`
- Runtime endpoint: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge`
- X post URL: add after manual publishing.
- Demo video URL: add after manual filming/upload.
- OKX.AI listing record: `AgentForge #3746`

## What To Say

- AgentForge is live as an OKX.AI ASP service record.
- The runtime has real x402 payment handling.
- Paid calls are ledger-backed and surfaced through dashboard/proof routes.
- Receipts and selected provenance records are verifiable through public verifier pages.
- The product was hardened after real buyer usage: preflight, quote binding, recovery, no-payment
  contract checks, post-settlement bookkeeping warnings, and outage drills.

## What Not To Say

- Do not claim G2 passed; external founders remain limited and recruitment is still upside.
- Do not claim independent customer reviews unless a review has a paid receipt and review ledger row.
- Do not claim guaranteed OKX approval, guaranteed revenue, guaranteed safety, wallet custody, or
  automatic listing control.
- Do not publish customer-specific vulnerability findings, exploit payloads, private buyer inputs,
  generated private deliverables, or unpublished security reports.
- Do not count make-good delivery as a marketplace review, rating, or completed platform task.

## Remaining Human Steps

1. Film the live demo using the existing T7.1 script, showing real live routes only.
2. Publish the X post manually.
3. Submit the Google form with the demo URL, X URL, and judge bundle URL.
4. Add the final demo/X/form URLs to evidence after submission.
