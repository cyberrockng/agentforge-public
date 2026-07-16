# ShieldCheck paid heartbeat

Date: 2026-07-14

## Result

ShieldCheck completed its own real paid heartbeat on the live production runtime.

- Service: `POST /svc/shieldcheck`
- Service title: `Phishing & Scam Review`
- Amount: `0.40 USDT`
- Network: `eip155:196`
- Payment tx: `0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5`
- Payer: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- Runtime status: HTTP `200`, `status: delivered`
- Deliverable verdict: `likely-scam`
- Delivered at: `2026-07-14T09:28:28.509Z`

## Ledger

Runtime `/ledger/summary` after the heartbeat:

- Paid calls: `2`
- Settled total: `1.400000 USDT`
- Forge revenue: `1.080000 USDT`
- Founder payable: `0.320000 USDT`

ShieldCheck row:

- Paid calls: `1`
- Settled: `0.400000 USDT`
- Forge revenue: `0.080000 USDT`
- Founder payable: `0.320000 USDT`
- ServiceCall ID: `sc_shieldcheck_642e7372000a`
- Ledger transaction ID: `lt_shieldcheck_642e7372000a`

## Receipt

- Receipt ID: `psr_shieldcheck_642e7372000a`
- Receipt JSON: `ops/evidence/2026-07-14-shieldcheck-heartbeat-receipt.json`
- Prepared anchor ID: `0x802bc0c334e571d529dc7487e6a0249f1faeafe51f1eacece9fa4ce4d48936ba`
- Subject hash: `0x9d92e1f140c458c26f9fa2f0e81890934acfd20d0cec700ff22d7f386af19968`
- Evidence hash: `0x184a1877837791437ab0c590cba2a354f889fc3173288809393282d2a9fcdf3e`
- Metadata hash: `0xf1bab6c55408ab970911c39ba0955050b492a4e6e35d922cd377915871e90b8f`

The receipt was left pending in the heartbeat-payment turn. After separate user approval, AgentForge anchored this receipt to ForgeAnchor on X Layer:

- ForgeAnchor contract: `0xfd43a18b2c09903922fa452f6813e7577c48569d`
- Anchor tx: `0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273`
- Block: `65253281`
- Anchored at: `2026-07-14T09:45:17Z`
- Gas used: `192826`
- Security scan: `onchainos security tx-scan` returned `action: ""`, `riskItemDetail: []`
- RPC readback: `hasAnchor(anchorId) == true`; `getAnchor(anchorId)` matched the subject, evidence, and metadata hashes above.

## Deployments used

- Callable-state runtime deployment: `fb399ed5-779b-4861-931e-b0bb78c5f6d0`
- Callable-state Vercel deployment: `dpl_Dn3YbBrR1uxFEPqgCff5kpH7kiYc`

Final evidence/verifier deployment after receipt publication:

- Railway deployment: `1ea745e9-8423-48f3-9f0e-2b8d8c4859aa`
- Vercel deployment: `dpl_7tzc4Gh3SQa3ciuKVBPwXTQEVT7s`
- Stable web alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`

Post-anchor verifier deployment:

- Vercel deployment: `dpl_BPrqLLgPAv4DXc4aBQ6WjFu5zfDL`
- Stable web alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`

## Live verification

Verified after final deploy before the later explicit anchor approval:

- Runtime `/ledger/summary`: HTTP `200`; contains `paidCalls: 2`, `sc_shieldcheck_642e7372000a`, and founder payable `320000`.
- `/verify/psr_shieldcheck_642e7372000a`: HTTP `200`; contained receipt title, payment tx, prepared anchor ID, and `Anchor pending`.
- `/verify/0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5`: HTTP `200`; resolves to the ShieldCheck receipt.
- `/dashboard`: HTTP `200`; shows ShieldCheck, `sc_shieldcheck_642e7372000a`, `0.400000 USDT`, and `0.320000 USDT`.
- `/guild`: HTTP `200`; links `psr_shieldcheck_642e7372000a` and states ShieldCheck completed one real paid heartbeat.
- `/a/shieldcheck`: HTTP `200`; shows `Paid heartbeat complete; controlled soft-launch`, `0.40 USDT`, and the live service endpoint link.

Verified after post-anchor deployment at `2026-07-14T09:51:11Z`:

- `/verify/psr_shieldcheck_642e7372000a`: HTTP `200`; contains receipt title, `X Layer anchor`, anchor tx `0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273`, and block `65253281`; does not contain `Anchor pending`.
- `/verify/0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273`: HTTP `200`; resolves to the ShieldCheck receipt.
- `/verify/0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5`: HTTP `200`; resolves to the ShieldCheck receipt.
- `/guild`: HTTP `200`; still links `psr_shieldcheck_642e7372000a`.
- `/dashboard`: HTTP `200`; still shows ShieldCheck `0.400000 USDT` settled and `0.320000 USDT` founder payable.

## Input used

The heartbeat used a real defensive scam-review prompt:

- Suspicious content: Telegram DM claiming an OKX airdrop, linking to a claim page that asks the user to connect wallet and sign before a timer expires.
- How received: Telegram DM from an account claiming to be support.
- Interaction status: user has not connected, signed, or entered secrets.

No seed phrase, private key, API secret, or wallet operation instruction was supplied.

## Boundary

- This proves ShieldCheck can receive and deliver one real paid non-QA service call.
- This does not guarantee wallet safety, revenue, OKX approval, or full public launch.
- No listing update or OKX identity command was run.
- No additional on-chain anchor broadcast was run during the paid heartbeat turn. The later ForgeAnchor broadcast above was run only after separate explicit user approval.
