# AUDIT-4 production deploy · runtime ledger volume and live verification

Date: 2026-07-14  
Builder: Codex

## Railway volume

- Service: `agentforge-runtime`
- Volume ID: `66a99c1d-086b-4e5e-bff6-c7c58987a6a9`
- Volume name: `agentforge-runtime-volume`
- Mount path: `/data`
- Size: `500 MB`
- Status: `Ready`

Command evidence:

```bash
railway volume list --json
```

Confirmed the volume is attached to `agentforge-runtime` and mounted at `/data`.

## Railway runtime deployment

- Deployment ID: `f38a8312-0653-4f4a-8cb6-eda8fa89dbc4`
- Status: `SUCCESS`
- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Deployment metadata included `volumeMounts: ["/data"]`
- Image digest: `sha256:8697afa6d654ff26b8ff4268b8803393b9acb6cebee6d9d7b3bf4d95b25a8e62`

Live verification:

- URL: `https://agentforge-runtime-production-9a4d.up.railway.app/ledger/summary`
- HTTP status: `200`
- Verified content:
  - source: `Runtime JSONL ledger journal`
  - paid calls: `1`
  - settled atomic: `1000000`
  - latest call: `sc_forge_b8f8787c7c13`
  - ShieldCheck row remains `0` paid calls.

## Vercel production deployment

- Deployment ID: `dpl_9TFM75fDoq3iyK5Nx4fLwVwasdko`
- Deployment URL: `https://web-loa54jxyg-cyberrockng-s-projects.vercel.app`
- Stable public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Status: `READY`

Build output confirmed dynamic routes:

- `/dashboard`: dynamic
- `/guild`: dynamic
- `/verify/[id]`: dynamic

## Live web verification

### `/dashboard`

- URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/dashboard`
- HTTP status: `200`
- Verified content:
  - `Founder Dashboard`
  - `Runtime JSONL ledger journal`
  - `sc_forge_b8f8787c7c13`
  - `psr_forge_b8f8787c7c13`
  - `ShieldCheck appears with zero paid calls`

### `/guild`

- URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/guild`
- HTTP status: `200`
- Verified content:
  - `Founder Guild`
  - `AgentForge`
  - `ShieldCheck`
  - `/verify/psr_forge_b8f8787c7c13`
  - `/verify/bc_shieldcheck_2026-07-13`
  - `ShieldCheck is gated; its own paid customer heartbeat is still pending.`
  - `Softlaunch tenant with no published receipt/certificate record yet.`

### `/verify/psr_forge_b8f8787c7c13`

- HTTP status: `200`
- Verified content:
  - `AgentForge First Heartbeat service receipt`
  - `Disclosed superseded anchors`
  - `0x635301188e5588de447c6c276711103ffb6e13a41dde1e3b91128ccf1983da02`
  - `local time was labeled as UTC`

### `/verify/bc_shieldcheck_2026-07-13`

- HTTP status: `200`
- Verified content:
  - `ShieldCheck birth certificate`
  - `Disclosed superseded anchors`
  - `0x045091f9630e7a8df933c48d19ccefb5ff20e12caa1c43f7d996fd546c4f1b47`
  - `incomplete AgentSpec snapshot hash`

### Unknown verifier record

- URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/not-a-real-record`
- HTTP status: `404`

## Boundary

- No wallet, payment, contract, OKX listing, or OKX identity action was run.
- No Railway secret variable values were printed.
- No paid call was initiated.
