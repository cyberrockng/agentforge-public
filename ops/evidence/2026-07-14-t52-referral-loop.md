# T5.2 Referral loop · 2026-07-14

Status: DONE.

## Acceptance

Buildbook acceptance:

- Referral loop.
- Referral credits must balance in the ledger.

Delivered:

- Added referral attribution to paid `ServiceCall` rows.
- Added allowlisted referral handling in the live runtime:
  - body fields: `referralCode`, `referral_code`, `referral.code`;
  - query fields: `?ref=`, `?referralCode=`;
  - unknown referral codes fail before x402 payment verification or settlement.
- Added current allowlisted codes:
  - `agentforge-guild` → `agentforge-growth-pool`;
  - `shieldcheck-founder` → `founder-abiola-apata`.
- Added referral policy:
  - `1000` bps;
  - basis: Forge share, not gross settlement;
  - referral credit is deducted from Forge revenue and credited to referral payable.
- Updated `/ledger/summary` and `/dashboard`:
  - Forge revenue is now net of referral debits;
  - `referralPayableAtomic` is visible in runtime summary and dashboard rows.

## Ledger treatment

For a paid call with an allowlisted referral code:

1. Debit settlement wallet for the full paid amount.
2. Credit founder payable based on the existing founder split.
3. Credit gross Forge revenue based on the existing Forge split.
4. Debit Forge revenue for the referral credit.
5. Credit `liability:referral:<beneficiaryId>` for the referral payable.

This keeps the transaction balanced and prevents referral credits from inflating Forge revenue.

Example covered by tests:

- ShieldCheck paid call: `0.400000 USDT`.
- Existing split:
  - founder payable: `0.320000 USDT`;
  - Forge gross share: `0.080000 USDT`.
- Referral credit at 10% of Forge share:
  - referral payable: `0.008000 USDT`;
  - Forge net revenue: `0.072000 USDT`.

No real referral-paid call was run in this task. The code path is live for the next real paid call that includes an allowlisted referral code.

2026-07-14 hardening update: anonymous unpaid quote responses no longer persist quoted `ServiceCall`
rows to the durable journal. Referral attribution is still parsed before payment so unknown codes can
fail pre-x402, but durable referral accounting is recorded only after a settled paid call.

## Files

- `packages/payments/src/index.ts`
- `packages/payments/src/ledger.test.ts`
- `apps/runtime/src/server.ts`
- `apps/runtime/src/ledger-summary.ts`
- `apps/runtime/src/ledger-summary.test.ts`
- `apps/web/src/lib/dashboard-ledger.ts`
- `apps/web/src/lib/dashboard-ledger.test.ts`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/templates/page.tsx`

## Validation

Local validation:

- `npm test` — PASS.
  - core: 8 files, 42 tests.
  - payments: 2 files, 24 tests.
  - provenance: 1 file, 8 tests.
  - runtime: 3 files, 18 tests.
  - web: 4 files, 19 tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `AGENTFORGE_LEDGER_PATH=ops/evidence/2026-07-13-t32-service-ledger.jsonl npm run ledger:check` — PASS.
  - delivered service calls: `3`;
  - ledger transactions: `3`;
  - USDT debit: `1850000`;
  - USDT credit: `1850000`.
- `npm run build` — PASS.

Production deployment:

- Railway runtime:
  - deployment id: `ba480c37-db65-4e9b-ba88-161ec0841054`;
  - URL: `https://agentforge-runtime-production-9a4d.up.railway.app`;
  - `/data` volume remained mounted.
- Vercel web:
  - deployment id: `dpl_8aPGnLRezSmUd7LcyujWr7qZxN3p`;
  - deployment URL: `https://web-7mexsubme-cyberrockng-s-projects.vercel.app`;
  - stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`.

Live verification:

- Runtime `/health` returned OK.
- Runtime `/svc/forge` and `/mcp/forge` expose referral program:
  - enabled: `true`;
  - bps: `1000`;
  - codes: `agentforge-guild`, `shieldcheck-founder`.
- Runtime `/ledger/summary` returned:
  - paid calls: `3`;
  - latest call: `sc_launch-kit_3b103d9976a5`;
  - referral payable: `0`.
- Web `/dashboard` returned HTTP `200` and shows:
  - `Forge revenue net`;
  - `Referral payable`;
  - `0.000000 USDT` referral payable.
- Web `/templates` returned HTTP `200` and shows the T5.2 referral-credit copy.
- Web `/guild` returned HTTP `200`.

## Boundaries

- No wallet, payment, contract, OKX listing, OKX identity, or `onchainos` command was run.
- No referral payout was executed.
- No real referral-paid call exists yet; the dashboard correctly remains `0.000000 USDT` referral payable until one occurs.
- T5.3 soft-launch cross-testing kit was not started.
- T5.4 X Launch Engine was not started.

## Next

Proceed to T5.3 Soft-launch cross-testing kit. It must require real paid calls for reviews and must not create mock reviews or fake traction.
