# AUDIT-5 independent verification record · 2026-07-14 · auditor: Claude (Fable 5)

Method identical to AUDIT-4: hashing reimplemented outside the repo, chain state read from public
X Layer RPC, production fetched from a clean client. Scope: T5.1–T5.4 plus all interstitial work
since AUDIT-4 (AUDIT-4 fix pass, ShieldCheck gate FAIL→PASS, ShieldCheck heartbeat + anchor,
Launch Kit heartbeat, two pricing changes).

## 1. Repo state

- main == origin/main == `426bbe1`, tree clean.
- `npm test` green: 120 tests (core 42, payments 24, runtime 8+18, web 28). typecheck 0 errors,
  lint clean, build clean.

## 2. Carried-fix verification (AUDIT-4 findings 1–4: ALL LANDED)

- `appendLedgerJournal` now re-reads the journal and runs `assertLedgerJournalIntegrity` on every
  append — duplicate delivered payment refs, duplicate sc_/lt_ ids, and unbalanced transactions
  all rejected (finding 1a). Tamper test + 500-generated-call uniqueness/balance property test
  present (1b). `/dashboard` and `/guild` read runtime `/ledger/summary` (live source: "Runtime
  JSONL ledger journal") backed by a Railway volume at `/data` (1c).
- ShieldCheck live Forge Gate: FAIL run honestly archived (`fg_live_473a440aa27f35b5`, score 0,
  11 findings), refusal fixes shipped, production PASS archived (`fg_live_bcba01f18229cbbd`,
  score 100, 18 probes) (finding 2).
- Supersession disclosed on verify pages; unknown `/verify/:id` → 404 live (findings 3–4).

## 3. New payment evidence verified on-chain

| call | payment tx | on-chain result |
|---|---|---|
| ShieldCheck heartbeat 0.40 USDT | `0x642e…86d5` | success, block 65252272, USDT transfer of exactly 400000 atomic to project wallet |
| Launch Kit heartbeat 0.45 USDT | `0x3b10…164a` | success, block 65254560, USDT transfer of exactly 450000 atomic to project wallet |

## 4. Receipt hash recomputation + anchors (8/8 PASS)

- `psr_shieldcheck_642e7372000a`: subject/evidence/metadata hashes + anchorId all recompute from
  the committed JSON; `getAnchor` readback matches all three hashes, issuer == project wallet,
  anchoredAt 1784022317; anchor tx `0xe550…6273` success at block 65253281.
- `psr_launch-kit_3b103d9976a5`: all four commitments recompute; `hasAnchor == false` on-chain,
  exactly matching the disclosed "Anchor pending" state (anchor awaits separate user approval).
- Full AnchorWritten scan deploy→65258887: exactly **5** events — 4 previously audited + the
  ShieldCheck receipt anchor. No undisclosed anchors.

## 5. Ledger math (live `/ledger/summary`)

- paidCalls 3; settled 1850000 == forge revenue 1530000 + founder payable 320000; referral
  payable honestly 0 (no referral-paid call exists). Per-row: forge 1000000 / shieldcheck 400000
  (split 320000+80000, 80/20 per policy) / launch-kit 450000. `ledger:check` against the committed
  seed journal: 3 calls, 3 transactions, USDT 1850000 == 1850000.

## 6. T5 subject-matter walk (live)

- `/templates` 200 — five templates, explicit "draft only … not a listed agent, receipt, review,
  customer win, or approval claim" caveat; core `createTemplateAgentSpecDraft` produces valid
  AgentSpec drafts (tested).
- Referral (T5.2): unknown code → 400 BEFORE x402 (live-probed); codes published on `/svc/forge`;
  balanced liability accounting enforced in code + tests; dashboard shows net Forge revenue and
  separate referral payable.
- `/cross-test` 200 — 3 eligible paid receipts listed, "0 verified cross-test reviews" honest,
  review gate rejects certificates/missing receipts/mismatched ServiceCall ids (tested).
- `/launch-engine` 200 — drafts for the 3 proof-backed tenants referencing ONLY real records
  (`psr_forge_b8f8787c7c13`, `bc_shieldcheck_2026-07-13`, `psr_shieldcheck_642e7372000a`,
  `psr_launch-kit_3b103d9976a5`), #OKXAI present, ≤280 chars by test, do-not-claim guardrails,
  "Human publish" rule stated; no post was made.
- Storefronts: `/a/shieldcheck` "Paid heartbeat complete; controlled soft-launch … not a guarantee
  of safety, revenue, OKX approval"; `/guild` carries Launch Kit's "self-operated … not counted as
  an external founder win" caveat.
- Runtime: `/svc/forge` quotes 0.40 USDT (== updated listing fee), `/svc/shieldcheck` softlaunch
  0.40 USDT.

## 7. Ladder state (I2) — ShieldCheck now evidence-complete

Gate PASS report (`fg_live_bcba01f18229cbbd`) + own paid heartbeat (`0x642e…86d5`) + birth
certificate (`bc_shieldcheck_2026-07-13`) + anchored receipt → `softlaunch` is evidence-backed.
Sequencing caveat recorded in the verdict (status was flipped before the payment settled).

Verdict recorded in the private operator audit log.
