# T4.3 Proof-of-Service Receipt · AgentForge First Heartbeat

Status: DONE

## Receipt of record

- Receipt ID: `psr_forge_b8f8787c7c13`
- Service: AgentForge `/svc/forge`
- ServiceCall ID: `sc_forge_b8f8787c7c13`
- Ledger transaction ID: `lt_forge_b8f8787c7c13`
- Payment: real `1 USDT` x402 call on X Layer
- Payment tx: `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b`
- Evidence source: `ops/evidence/2026-07-04-first-heartbeat.md`
- Ledger source: `ops/evidence/2026-07-13-t32-ledger-backfill.json`

Truth boundary:

- This receipt proves one real paid non-QA call to AgentForge `/svc/forge`.
- It does not prove ShieldCheck has completed a paid customer call to its own service endpoint.
- It does not change ShieldCheck from gated to public-callable.

## Receipt anchor

- ForgeAnchor contract: `0xfd43a18b2c09903922fa452f6813e7577c48569d`
- Anchor ID: `0xc5d32389823167b3a0927992294e31a4bafc904e07b2a3bfd171495eb00c0f7a`
- Anchor tx: `0x369e30fc61c11e8b9ccfc7a495aa310feff15fd7192ec358727e50c793f2ca9b`
- Block: `65211025`
- Anchored at UTC: `2026-07-13T22:01:01Z`
- Gas used: `192850`

Commitments:

- Subject hash: `0x9c0be40f30d1415fb03f52e09312cff41547af53be90c4d0c748dea80a4a22b6`
- Evidence hash: `0x36f8bdb5d65614afe9372dd46c2e0ecd6092f6b18e37382ea1306f031ba719ba`
- Metadata hash: `0xa001ad222b56dc957e501690cdd537ac6b505c7c264770ca9629f42813b22d21`

Contract readback:

- `hasAnchor(anchorId)`: `true`
- `getAnchor(anchorId).subjectHash`: `0x9c0be40f30d1415fb03f52e09312cff41547af53be90c4d0c748dea80a4a22b6`
- `getAnchor(anchorId).evidenceHash`: `0x36f8bdb5d65614afe9372dd46c2e0ecd6092f6b18e37382ea1306f031ba719ba`
- `getAnchor(anchorId).metadataHash`: `0xa001ad222b56dc957e501690cdd537ac6b505c7c264770ca9629f42813b22d21`

Security gate:

- `onchainos security tx-scan`: `ok=true`
- Risk items: `[]`
- Warnings: `null`
- Revert reason: empty

## Superseded anchor

An earlier T4.3 receipt anchor was broadcast with local time labeled as `Z`/UTC in `issuedAt`. It is not the receipt of record.

- Superseded anchor ID: `0x273476f819b3a7763dde869b53db06d936619af24684b3f74ede2ee3270561c5`
- Superseded tx: `0x635301188e5588de447c6c276711103ffb6e13a41dde1e3b91128ccf1983da02`
- Superseded block: `65210919`

## Public verifier

The web app publishes this receipt through the same verifier route used for birth certificates:

- `/verify/psr_forge_b8f8787c7c13`
- alias: `/verify/forge-first-heartbeat`
- alias: `/verify/sc_forge_b8f8787c7c13`

Production deployment and live verification on 2026-07-13:

- Vercel deployment ID: `dpl_9zzvy8ZRCrFrTFGHz6Ux5Tsy8CkQ`
- Deployment URL: `https://web-6fxhiz7i0-cyberrockng-s-projects.vercel.app`
- Stable public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Live receipt URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/psr_forge_b8f8787c7c13`
- HTTP status: `200`
- Verified body contained the receipt title, proof-of-service label, corrected anchor tx, corrected anchor ID, and ShieldCheck caveat.
- Live dashboard URL: `https://web-one-peach-2vp0hv3dr1.vercel.app/dashboard`
- HTTP status: `200`
- Verified body contained `Proof-of-service receipt` and `/verify/psr_forge_b8f8787c7c13`.
