# T2.3 Founder #1 real agent activation

Date: 2026-07-13

## Current status

T2.3 is `DONE`.

Reason: founder consent is recorded, ShieldCheck is implemented as a gated Founder #1 tenant born from a real paid AgentForge forge call, production runtime/web deployments are complete, and live URLs were verified.

## Candidate source

Existing real evidence:

- First Heartbeat evidence: `ops/evidence/2026-07-04-first-heartbeat.md`
- First Heartbeat deliverable: `ops/evidence/2026-07-04-first-heartbeat-deliverable.json`
- Paid x402 transaction: `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b`
- Amount: 1 USDT on `eip155:196`
- Candidate agent package: `ShieldCheck`

Boundary: the candidate is not public-active from T2.3 yet. It has a real heartbeat source, but it still needs explicit founder confirmation and consent before AgentForge can claim it as Founder #1 in a public founder page, Guild entry, listing package, demo, or launch post.

## Founder consent

Consent received from Abiola in this session on 2026-07-13:

> Yes, Use ShieldCheck as Founder #1 and I consent to publish the founder name and service details.

This satisfies the Founder #1 consent blocker for using:

- founder name: `Abiola Apata`,
- agent name: `ShieldCheck`,
- ShieldCheck service details from the First Heartbeat deliverable,
- the First Heartbeat transaction as the activation proof reference.

## Implementation added

Added `packages/core/src/founder-activation.ts` and tests.

The activation gate requires:

- a valid `AgentSpec`,
- matching founder consent,
- consent to publish the agent page,
- consent to use the founder name in agent material,
- real paid AgentForge forge-call proof with a transaction hash,
- Forge Gate pass evidence,
- a separate ShieldCheck-owned heartbeat before it can move beyond gated status.

This prevents T2.3 from silently turning a draft/spec into a public founder agent without H4 evidence.

## Repo activation added after consent

- Added `ShieldCheck` to the shared runtime tenant catalog as a `gated` status tenant.
- Added `ShieldCheck` to the web storefront catalog mirror so `/a/shieldcheck` can be generated.
- Added Founder #1 proof metadata:
  - founder: `Abiola Apata`,
  - AgentForge forge genesis tx: `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b`,
  - forge-call evidence: `ops/evidence/2026-07-04-first-heartbeat.md`,
  - consent evidence: this file.
- Added runtime guard so `gated` and `heartbeat` tenants return `service_not_callable_yet` before x402 payment handling. This prevents direct paid POST bypasses while ShieldCheck waits for the next ladder gate.
- Fixed the founder-activation module to avoid importing runtime values back from `@agentforge/core` index. Local runtime boot caught the ESM circular initialization; the activation schema is now self-contained.

## Production deployment

User approved: `push + Railway runtime deploy + Vercel production deploy + live verification`.

Git commit deployed:

- `0f5a3d4 [T2.3] activate ShieldCheck founder tenant`

Railway runtime:

- Deployment ID: `acaee9f6-f321-49bf-b307-a0bf3b4a7bb8`
- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Status: `SUCCESS`

Vercel web:

- Deployment ID: `dpl_C6STQyeP9V8fxbrC2zbpF2s3aBi1`
- Production URL: `https://web-h4zbzmrx5-cyberrockng-s-projects.vercel.app`
- Public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Status: `READY`

## Live verification

Runtime checks:

- `GET https://agentforge-runtime-production-9a4d.up.railway.app/health` returned HTTP 200.
- `GET https://agentforge-runtime-production-9a4d.up.railway.app/svc/shieldcheck` returned HTTP 200 with tenant status `heartbeat` before AUDIT-2 correction; next deployment must report `gated`.
- `GET https://agentforge-runtime-production-9a4d.up.railway.app/mcp/shieldcheck` returned HTTP 200 with status `heartbeat` before AUDIT-2 correction; next deployment must report `gated`.
- `POST https://agentforge-runtime-production-9a4d.up.railway.app/svc/shieldcheck` returned HTTP 409 `service_not_callable_yet` before x402 payment handling.

Web checks:

- `GET https://web-one-peach-2vp0hv3dr1.vercel.app/forge` returned HTTP 200 and rendered ShieldCheck. AUDIT-2 later required status/copy correction from heartbeat-stage to gated/provenance-born.
- `GET https://web-one-peach-2vp0hv3dr1.vercel.app/a/shieldcheck` returned HTTP 200 and rendered:
  - `ShieldCheck`,
  - founder `Abiola Apata`,
  - `Phishing & Scam Review`,
  - `Heartbeat complete; next gate pending` before AUDIT-2 correction,
  - `No public call link is exposed`,
  - First Heartbeat tx `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b` before AUDIT-2 correction.
- Existing storefront routes `/a/forge` and `/a/launch-kit` still returned HTTP 200.

## Verification

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected result:

- catalog includes `shieldcheck`,
- payment routes exclude `shieldcheck` while status is `gated`,
- `/a/shieldcheck` is generated in production build,
- full repo validation passes.

Local runtime verification:

```bash
PORT=4210 HOST=127.0.0.1 node apps/runtime/dist/server.js
curl -sS http://127.0.0.1:4210/svc/shieldcheck
curl -sS -X POST http://127.0.0.1:4210/svc/shieldcheck \
  -H 'content-type: application/json' \
  -d '{"reviewType":"phishing_scam_review"}'
```

Observed result:

- Runtime booted successfully after the ESM cycle fix.
- `GET /svc/shieldcheck` returned metadata with status `heartbeat` before AUDIT-2 correction.
- `POST /svc/shieldcheck` returned `service_not_callable_yet` before payment handling.

Earlier activation-gate checks:

```bash
npm test --workspace @agentforge/core
npm run typecheck --workspace @agentforge/core
```

Expected result: founder activation tests pass and prove that missing consent, mismatched founder IDs, malformed forge-call transactions, and missing ShieldCheck-owned heartbeat status block activation.
