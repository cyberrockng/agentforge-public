# T4.2 ShieldCheck birth certificate

Date: 2026-07-13  
Builder: Codex

## Scope completed

- Created the first AgentForge birth certificate for ShieldCheck.
- Anchored the certificate to the deployed ForgeAnchor contract on X Layer.
- Wired the public verifier route to render the certificate at `/verify/bc_shieldcheck_2026-07-13`.
- Linked ShieldCheck's storefront profile to the certificate.

## Certificate of record

- Certificate ID: `bc_shieldcheck_2026-07-13`
- Agent: `ShieldCheck`
- Agent ID: `agentforge-shieldcheck-01`
- Founder: `Abiola Apata`
- Founder ID: `founder-abiola-apata`
- Status at issue: `gated`
- AgentSpec hash: `0x55d56a168e3842328bf5767ba8095156fdfa1296e3ee011abf432a9665221c68`
- Evidence file: `ops/evidence/2026-07-13-t42-shieldcheck-birth-certificate.json`

Truth boundary:

- This certificate proves ShieldCheck was born from a real paid AgentForge `/svc/forge` call.
- It does **not** claim ShieldCheck has completed its own paid customer heartbeat.
- ShieldCheck remains non-public-callable until its own heartbeat/softlaunch gates are satisfied.

## Source evidence

- Paid forge-call tx: `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b`
- Network: `eip155:196`
- Amount: `1 USDT`
- Service call: `sc_forge_b8f8787c7c13`
- Ledger transaction: `lt_forge_b8f8787c7c13`
- First Heartbeat evidence: `ops/evidence/2026-07-04-first-heartbeat.md`
- First Heartbeat deliverable: `ops/evidence/2026-07-04-first-heartbeat-deliverable.json`
- Founder consent: `ops/evidence/2026-07-13-t23-founder-one-activation.md`

## Anchor

- ForgeAnchor contract: `0xfd43a18b2c09903922fa452f6813e7577c48569d`
- Anchor ID: `0x5bab8d702877c0aee90587003fbab09dd14faf62808a4c1336fee28d71e289f1`
- Subject hash: `0x35731903ee7f758d8f7e74123a069b50b52d766b434dc0aad223f34da1c719da`
- Evidence hash: `0xcd30b4203b273f10e552312b9e9c0ef79120197a6c5c55a681a898c155772600`
- Metadata hash: `0xa34bb7f4cff1a6cd10433806afa4951d2a661004a8157683d0ad832a42249ba3`
- Anchor tx: `0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a`
- Block: `65210139`
- Gas used: `192826`
- On-chain `anchoredAt`: `1783979175` (`2026-07-13T21:46:15Z`)
- Security scan: completed with no block/warn action and no risk items.

RPC verification:

- Transaction receipt status: `success`
- `hasAnchor(anchorId)`: `true`
- `getAnchor(anchorId)` matched the expected subject, evidence, and metadata hashes.
- `issuer`: `0xfc9b58e81BcE27c2f46558D501228D935f93e802`

## Superseded anchor

One earlier T4.2 anchor was created with an incomplete `agentSpecSnapshot` hash because the generator read the wrong JSON path in `2026-07-04-first-heartbeat-deliverable.json`.

- Superseded anchor ID: `0x0c02e6671071e778af4113ed1661ce019e23594bf097aa9fe50086839edef8b2`
- Superseded tx: `0x045091f9630e7a8df933c48d19ccefb5ff20e12caa1c43f7d996fd546c4f1b47`
- Status: on-chain success, but **not** the certificate of record.
- Correction: anchored the final certificate using the root `agentSpecDraft` with 4 services, persona, boundaries, and knowledge fields.

## Public verifier

The web verifier recognizes:

- `/verify/bc_shieldcheck_2026-07-13`
- `/verify/shieldcheck`
- `/verify/agentforge-shieldcheck-01`
- `/verify/0x5bab8d702877c0aee90587003fbab09dd14faf62808a4c1336fee28d71e289f1`
- `/verify/0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a`

Production verification on 2026-07-13:

- Vercel deployment ID: `dpl_4VH1Jg8rFUfbbAtB4Lh6biXWg8tf`
- Deployment URL: `https://web-6opp5qqda-cyberrockng-s-projects.vercel.app`
- Stable public alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
- Live URL verified: `https://web-one-peach-2vp0hv3dr1.vercel.app/verify/bc_shieldcheck_2026-07-13`
- HTTP status: `200`
- Verified body contained the ShieldCheck title, certificate caveat, ForgeAnchor contract, and anchor tx.

## Boundary

- No OKX listing mutation was performed.
- No ShieldCheck paid customer call was run.
- No public-callable status change was made for ShieldCheck.
