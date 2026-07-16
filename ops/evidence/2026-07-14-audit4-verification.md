# AUDIT-4 independent verification record · 2026-07-14 · auditor: Claude (Fable 5)

Method: every check below was re-derived from scratch — hashing reimplemented outside the repo
(not imported from `@agentforge/provenance`), chain state read from the public X Layer RPC
(`https://rpc.xlayer.tech`, chainId 196 confirmed), production surfaces fetched from a clean client.

## 1. Repo state

- main == origin/main == `d77b72b`, working tree clean.
- `npm test` green: core 36, payments 14, runtime 8, web 11 (69 total). `typecheck`, `lint`, `build` all pass.
- Diff scan `1ccb7e4..HEAD` for key material: clean (prose mentions only). Temporary deployer key
  never persisted, consistent with T4.1 boundary notes.

## 2. Hash recomputation from committed artifacts (10/10 PASS)

From `ops/evidence/2026-07-13-t42-shieldcheck-birth-certificate.json`:

| check | recomputed == recorded |
|---|---|
| agentSpecHash from embedded agentSpecSnapshot | PASS `0x55d5…1c68` |
| subjectHash | PASS `0x3573…19da` |
| evidenceHash | PASS `0xcd30…2600` |
| metadataHash | PASS `0xa34b…9ba3` |
| anchorId | PASS `0x5bab…89f1` |
| canonicalMetadata block hashes to metadataHash | PASS |

From `ops/evidence/2026-07-13-t43-proof-of-service-receipt.json`:

| check | recomputed == recorded |
|---|---|
| subjectHash | PASS `0x9c0b…22b6` |
| evidenceHash | PASS `0x36f8…19ba` |
| metadataHash | PASS `0xa001…2d21` |
| anchorId | PASS `0xc5d3…0f7a` |

## 3. On-chain readback (X Layer, contract `0xfd43a18b2c09903922fa452f6813e7577c48569d`)

- `eth_getCode`: 1266 bytes (matches T4.1 evidence); keccak256(code) `0x26ea2f87a8e8b839d839a5bda769c7de9993e8bbbb5469b4c18415f27cfc9739`.
- `owner()` → `0xfc9b58e81BcE27c2f46558D501228D935f93e802` == AgentForge wallet. PASS.
- Birth certificate anchor `0x5bab…89f1`: `hasAnchor` true; `getAnchor` subject/evidence/metadata
  hashes all match §2; issuer == owner; anchoredAt 1783979175 (2026-07-13T21:46:15Z). Anchor tx
  `0x8d17…d00a` status success, block 65210139. PASS.
- Receipt anchor `0xc5d3…0f7a`: `hasAnchor` true; `getAnchor` all hashes match §2; issuer == owner;
  anchoredAt 1783980061 (2026-07-13T22:01:01Z). Anchor tx `0x369e…ca9b` status success,
  block 65211025. PASS.
- Anchor txs route via the ERC-4337 EntryPoint (`0x…71727de22e5e9d8baf0edac6f37da032`), consistent
  with the OKX Agentic smart wallet; recorded on-chain issuer is the AgentForge wallet itself.

## 4. Full AnchorWritten event scan (no undisclosed anchors)

Scanned every block from deploy (65209391) to 65223204 in 100-block windows:
exactly **4** AnchorWritten events —

| block | anchorId | disposition |
|---|---|---|
| 65210010 | `0x0c02…ef8b2` | superseded T4.2 attempt — disclosed in bc JSON with reason |
| 65210139 | `0x5bab…89f1` | birth certificate of record |
| 65210919 | `0x2734…61c5` | superseded T4.3 attempt — disclosed in receipt JSON with reason |
| 65211025 | `0xc5d3…0f7a` | receipt of record |

Every on-chain anchor is accounted for in evidence files with an honest supersession reason. PASS.

## 5. Live production walk (clean client)

Web `https://web-one-peach-2vp0hv3dr1.vercel.app`:
- `/guild` 200 — AgentForge + ShieldCheck only, both verifier links, ShieldCheck gated caveat,
  Launch Kit exclusion stated. Matches `guild.ts` + tests.
- `/verify/bc_shieldcheck_2026-07-13` 200 — correct (superseding) anchorId, hashes, anchor tx,
  explorer links, caveat "does not claim ShieldCheck has completed its own paid customer heartbeat".
- `/verify/psr_forge_b8f8787c7c13` 200 — correct anchorId/hashes/tx, caveat "not a ShieldCheck customer call".
- `/verify/does-not-exist-xyz` — honest "No verification record" copy (HTTP 200; nit: should be 404).
- `/dashboard` 200 — links the proof-of-service receipt.

Runtime `https://agentforge-runtime-production-9a4d.up.railway.app`:
- `/health` 200.
- `GET /svc/shieldcheck` → status `gated`; `POST /svc/shieldcheck` → 409 before payment (ladder enforced live).
- SEC-2 re-proven: valid-unpaid `POST /svc/forge` → 402 with x402 v2 `payment-required`
  (eip155:196, amount 1000000, payTo AgentForge wallet); forged `X-PAYMENT` header → 402
  (no deliverable); malformed body → 400 before payment (buyer-protecting order).

Verdict recorded in the private operator audit log.
