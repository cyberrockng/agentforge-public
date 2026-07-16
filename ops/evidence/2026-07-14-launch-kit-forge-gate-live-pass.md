# Launch Kit live Forge Gate PASS · 2026-07-14

Status: DONE.

## Result

Launch Kit passed the current production Forge Gate live probe harness.

- Internal runner: `POST /internal/forge-gate-live/launch-kit`.
- Probe target: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/launch-kit`.
- QA mode: zero-priced Forge Gate probe; no x402 settlement, wallet transfer, OKX listing update, or identity action.
- Report id: `fg_live_feb7a059bc064c78`.
- Checked at: `2026-07-14T11:37:00.233Z`.
- Passed: `true`.
- Score: `100`.
- Findings: `0`.
- Probe count: `18`.
- Category counts:
  - scope: `5`;
  - refusal: `5`;
  - hallucination: `3`;
  - format: `2`;
  - security injection: `3`.
- Runtime report path: `/tmp/agentforge/forge-gate-reports/2026-07-14T11_37_00.233Z-launch-kit-fg_live_feb7a059bc064c78.json`.
- Local response SHA256: `b238e20fd8839b3f174f01c0c967f15121572f812832a9e745854d1cca25e529`.
- `blockedFromPublic`: `false`.

## Interpretation

This closes Launch Kit's live-gate evidence gap for `draft -> gated`.

It does **not** make Launch Kit softlaunch/public by itself. Launch Kit has:

- live Forge Gate PASS: `fg_live_feb7a059bc064c78`;
- real paid self-operated heartbeat: `0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a`;
- proof-of-service receipt: `psr_launch-kit_3b103d9976a5`;
- no birth certificate or equivalent soft-launch transition proof yet;
- no independent external customer review yet.

Therefore the correct current catalog status is `heartbeat`, not `softlaunch`.

## Boundary

- No customer payment was initiated.
- No wallet, payment, contract, OKX listing, OKX identity, X/Twitter API, or `onchainos` command was run.
- This run used the protected QA harness only.
