# FIRST HEARTBEAT — real paid call, end to end (2026-07-04)
- Buyer: our Agentic Wallet (founder-pays-own-service, per Buildbook I2b)
- Service: AI Agent Business Builder, /svc/forge, 1 USDT via x402 exact (EIP-3009, TEE-signed)
- Settlement tx: 0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b (eip155:196, amount 1000000)
- HTTP 200 in 29.8s; deliverable: full agent business package for test founder brief "ShieldCheck" (cybersecurity) — positioning, 4-service menu with prices/buyer-inputs/output-formats. Quality: PASS as paying customer.
- Net cost: $0.00 (payer==payee, gas-free X Layer)
- Fixes shipped during test (Claude hotfixes, logged): canonical x402 challenge (commit 3f27a42), SDK as single source of 402 truth (a3b8848), type fix after I6 violation (bef4b8a — lesson: never commit before build verified clean)
- Known UX gap for Codex: input schema mismatch (servicesOffered/boundaries must be arrays; GET info doesn't say so; 400 arrives only AFTER buyer signs payment — add fail-fast validation pre-payment + schema in GET info)
