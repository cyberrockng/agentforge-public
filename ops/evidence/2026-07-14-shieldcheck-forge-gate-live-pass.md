# ShieldCheck live Forge Gate PASS

Date: 2026-07-14

## Scope

This closes the ShieldCheck Forge Gate blocker recorded in `2026-07-14-shieldcheck-forge-gate-live-fail.md`.

Code fix:

- Commit: `5324475 [runtime] fix shieldcheck forge gate refusals`
- Pushed to `origin/main`

Runtime deployment:

- Railway deployment: `e5944ffa-0542-4db6-94d1-47a8c4b19a8b`
- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Volume remained mounted at `/data`

Web deployment:

- Vercel deployment: `dpl_6bRoegeCDnknpuPUKN5S1eGvHFnt`
- Deployment URL: `https://web-gcgqxkd1z-cyberrockng-s-projects.vercel.app`
- Stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`

## Gate result

Production live Forge Gate target:

- Internal runner: `POST /internal/forge-gate-live/shieldcheck`
- Probe target: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/shieldcheck`
- Report id: `fg_live_bcba01f18229cbbd`
- Checked at: `2026-07-14T09:07:22.946Z`
- Passed: `true`
- Score: `100`
- Findings: `0`
- Probe count: `18`
- blockedFromPublic: `false`

Probe coverage:

- Scope: `5`
- Refusal: `5`
- Hallucination: `3`
- Format: `2`
- Security injection: `3`

Archived full transcript:

- JSON: `ops/evidence/2026-07-14-shieldcheck-forge-gate-live-pass.json`
- SHA256: `ec3484d46e78269b6b36fd3b5a2155d3796bbaf3cc30d327cf8524a877661f9d`

## Live verification after deploy

Runtime:

- `/health`: HTTP `200`
- `/svc/shieldcheck`: HTTP `200`, tenant status `gated`
- `/ledger/summary`: HTTP `200`, source `Runtime JSONL ledger journal`, paid calls `1`, settled atomic `1000000`

Web:

- `/a/shieldcheck`: HTTP `200`; shows ShieldCheck, status gate/gated wording, `0.40 USDT`, and own heartbeat pending caveat.
- `/dashboard`: HTTP `200`; shows `Founder Dashboard`, `Runtime JSONL ledger journal`, and ShieldCheck with zero paid calls.
- `/guild`: HTTP `200`; shows ShieldCheck as gated and excludes Launch Kit until it has a published receipt/certificate.
- `/verify/bc_shieldcheck_2026-07-13`: HTTP `200`; shows superseded anchor disclosure.
- `/verify/psr_forge_b8f8787c7c13`: HTTP `200`; shows superseded anchor disclosure and the ShieldCheck caveat.

## Validation

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Local compiled-runtime Forge Gate against ShieldCheck: `fg_live_332d91b6f3aba17d`, passed `true`, score `100`, findings `0`
- Production Forge Gate against ShieldCheck: `fg_live_bcba01f18229cbbd`, passed `true`, score `100`, findings `0`

## Interpretation

The Forge Gate blocker for ShieldCheck is removed.

ShieldCheck still remains gated/non-public-callable because its own paid heartbeat has not been run. Next transition requires a real paid ShieldCheck call and updated receipt/evidence. This pass report only proves its current endpoint can reject unsafe probes and stay inside tenant boundaries.

## Boundary

- No wallet, payment, contract, listing, or OKX identity action was run.
- No paid ShieldCheck heartbeat was attempted.
- No ShieldCheck public status transition was made.
- No Railway secret value was printed.
