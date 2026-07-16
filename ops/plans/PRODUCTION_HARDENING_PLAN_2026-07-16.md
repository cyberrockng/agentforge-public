# AgentForge Production Hardening Plan — 2026-07-16

**Author:** Claude (holistic read of the full runtime, core, payments, and web surfaces)
**Executor:** Codex (each task is self-contained; do them in the stated order)
**Goal:** Make AgentForge the most *reliable and trustworthy* paid agent service in the OKX.AI x402 niche — no buyer ever pays and gets an error, the safety/quality gate never fails open, and the security posture is defensible under judge scrutiny. This is not a rewrite; it is a hardening pass on the existing product.

---

## 0. How to use this document

- Execute tasks **in numeric order**. Tiers are ordered by blast radius, not convenience.
- Every task has: **Class** (the failure *category* it kills, not one instance), **Evidence** (file:line I verified), **Change**, **Acceptance**, **Tests**, **Validation**.
- **Definition of done for every task:** `npm test --workspaces`, `npm run typecheck`, `npm run lint` all green, plus the task's own new test(s) proving the fix.
- **Guardrails that bind every task:**
  1. **Fail-closed invariant is sacred:** never settle payment for a deliverable that has not been fully built and passed the quality gate. Do not "optimize" by moving `processSettlement` earlier.
  2. **Settled ⇒ delivered invariant (new, see T1):** once `processSettlement` succeeds, the buyer MUST receive the deliverable in the HTTP response. Bookkeeping failures after settlement degrade to warnings; they never convert a paid call into an error response.
  3. **No fabricated claims** in copy, tests, or evidence. Real numbers only.
  4. **private audit-log boundary:** customer-specific security notes are **PRIVATE, DO NOT PUBLISH / DO NOT COMMIT**. Keep them outside tracked public source; disclosure timing is the user's call.
  5. One commit per task, message describing the *class* fixed.

---

## TIER 1 — Money-loss and fail-open bugs (do first; these are what buyers keep hitting)

### T1. Enforce the "settled ⇒ delivered" invariant — stop charging buyers who then get an error
**Severity:** CRITICAL (real fund loss + the "buyer paid, got an error" complaint class)
**Class:** Any post-settlement side effect (ledger write, recovery-handle build, archive write, response serialization) that throws currently rolls into the same `catch` that returns `400 forge_delivery_failed` — *after the on-chain payment already settled*. The buyer is debited, receives an error, and because the ledger row was never written, the recovery endpoint returns `payment_not_found_in_agentforge_ledger` (total loss → manual make-good only).
**Evidence:** `apps/runtime/src/server.ts:730-865`. `processSettlement` at :742; `persistLedgerRecords` at :779 is **unguarded**; the outer `catch` at :860 returns `400`. The archive write at :827 is guarded (good) but it runs *after* the ledger write, so a ledger throw skips it entirely.
**Change:**
- Restructure `handleTenantService` so that everything after a successful `processSettlement` is inside a "best-effort bookkeeping" block that **cannot** turn into a non-2xx response. Concretely:
  - Keep `buildTenantDeliverable` + input validation **before** settlement (unchanged — that is the fail-closed path).
  - After `settlement.success === true`, wrap `persistLedgerRecords`, recovery-handle build, and `persistDeliveryArchive` each in their own try/catch. On any failure, log server-side, set a `bookkeepingWarning` field on the response, and **still return `200` with the `deliverable` and the settlement `receipt`**.
  - If the ledger write fails, the response must still include enough for the buyer to self-recover: the `receipt.transaction`, the `serviceCallId` (compute it before the write so it is stable), and a `recovery` block whose `archivePersisted`/`ledgerPersisted` booleans tell the truth.
- Add an explicit `ledgerPersisted: boolean` to the `recovery` object mirroring the existing `archivePersisted`.
**Acceptance:**
- Simulate `appendLedgerJournal` throwing after a successful settlement → response is `200`, contains `deliverable`, `receipt.transaction`, and `recovery.ledgerPersisted === false` with a human-readable `bookkeepingWarning`.
- Simulate `persistDeliveryArchive` throwing → still `200` with deliverable (already true today; keep it true).
- A pre-settlement failure (LLM error, bad body) still returns `400`/`4xx` and **no** settlement occurs (fail-closed unchanged).
**Tests:** `apps/runtime/src/server.test.ts` (new file if absent) or extend an existing runtime test that can inject a stub x402 server + a stub ledger writer that throws. Assert status code and body shape for: (a) ledger-throw-after-settle, (b) archive-throw-after-settle, (c) LLM-throw-before-settle.
**Validation:** full workspace test + typecheck + lint.

### T2. Make `persistLedgerRecords` safe under concurrency and never corrupt on partial write
**Severity:** HIGH
**Class:** `appendLedgerJournal` does read-whole-journal → integrity-check → append, with no serialization. Two concurrent settlements interleave between the `readLedgerJournal` await and the `appendFile` await, so the integrity gate validates a stale snapshot and a genuine duplicate/imbalance can slip in; at scale the O(n)-per-write re-read also degrades every settlement.
**Evidence:** `packages/payments/src/journal.ts:26-31` (read-then-append, no lock); called from `apps/runtime/src/server.ts:1821`.
**Change:**
- Add an in-process async mutex (a simple promise-chain lock keyed by journal path) around `appendLedgerJournal` so appends serialize within the single Railway instance. Keep it in `packages/payments` so the invariant lives with the writer, not the caller.
- Keep the integrity check but run it inside the lock so it validates the true current tail.
- Document (comment) that cross-instance safety requires an external store; this lock covers the current single-instance deployment. Do **not** over-build a distributed lock now.
**Acceptance:** a test that fires N concurrent `appendLedgerJournal` calls for distinct payments resolves with all N persisted, journal still passes `checkLedgerJournal`, and no duplicate-id error is thrown spuriously.
**Tests:** `packages/payments/src/ledger.test.ts` — add a concurrency test using `Promise.all` over the locked writer.
**Validation:** payments workspace test + full suite.

### T3. Retry transient LLM failures before failing the paid path
**Severity:** HIGH (reliability; directly caused the credit-exhaustion outage and shows up to buyers as `forge_delivery_failed`)
**Class:** `createAnthropicModelClient` does a single fetch. Any transient upstream blip (HTTP 429, 500, 503, 529 overload, or a network reset) becomes an immediate buyer-visible failure with no retry. Because generation happens before settlement, the buyer is not charged — but they still see a failure and may not retry, and it reads as "the product is flaky."
**Evidence:** `packages/core/src/anthropic-client.ts:60-118` — single `fetchFn` call, no retry/backoff. Timeout handling exists (good) but no retry.
**Change:**
- Add bounded retry with jittered exponential backoff (e.g. up to 2 retries, base ~400ms) around the fetch, retrying **only** on: `AbortError`-free network errors, and HTTP status ∈ {429, 500, 502, 503, 529}. Never retry 4xx auth/validation (401/400) or a schema-parse failure.
- The total retry budget must stay under the buyer/gateway timeout envelope — keep the per-attempt `timeoutMs` and cap total wall-clock (e.g. ≤ ~45s) so retries can't outlive the caller.
- Surface the final failure with the last upstream status in the message (already partially done at :105).
**Acceptance:** injected `fetchFn` returning 529 twice then 200 → client returns the parsed result; returning 401 → fails immediately with no retry; three 503s → fails after the retry budget with a clear message.
**Tests:** `packages/core/src/anthropic-client.test.ts` (new) with a stub `fetchFn`.
**Validation:** core workspace test + full suite.

### T4. Guard model-output JSON parsing (Haiku returns malformed JSON more often than Sonnet)
**Severity:** MEDIUM-HIGH
**Class:** `JSON.parse(extractJsonText(textBlock.text))` throws a raw `SyntaxError` when the model returns non-JSON or truncated JSON (more likely on the cheaper model and near `max_tokens`). It surfaces as an opaque failure rather than a clean, retryable signal.
**Evidence:** `packages/core/src/anthropic-client.ts:115` and `extractJsonText` at :124-140.
**Change:**
- Wrap the parse in a typed error (`ModelOutputParseError`) with a short, non-leaking message ("model returned unparseable output"). Treat it as retryable within T3's budget (a re-roll often succeeds).
- Consider raising `max_tokens` headroom for the forge draft if truncation is the common cause (verify against a real draft size before changing; do not guess).
**Acceptance:** stub `fetchFn` returning a text block of `"not json"` → throws `ModelOutputParseError`, and (with T3) is retried once before final failure.
**Tests:** extend `anthropic-client.test.ts`.
**Validation:** full suite.

---

## TIER 2 — Security architecture

### T5. Fix the rate-limiter bypass + unbounded-memory vector
**Severity:** HIGH (security)
**Class:** `resolveClientIp` trusts the **first** `X-Forwarded-For` value, which is fully client-controlled. An attacker rotating `X-Forwarded-For` gets a fresh bucket per request → rate limit fully bypassed, **and** the `InMemoryRateLimiter.buckets` map grows without bound because `prune()` is never scheduled → slow memory exhaustion / eventual crash (a self-inflicted downtime vector).
**Evidence:** `apps/runtime/src/rate-limit.ts:39-64` (`prune()` defined but never called — confirmed no `setInterval`/`.prune(` caller in `server.ts`); `resolveClientIp:67-79` reads the first XFF hop.
**Change:**
- **Trusted-proxy IP resolution:** on Railway the trustworthy client identifier is the platform-injected header. Resolve client IP from the *right* hop (Railway/Cloudflare header) rather than the raw first XFF entry. Add a `TRUSTED_PROXY_HEADER` config (default to the platform header actually present — verify by logging headers once in a throwaway check, then hard-code the correct one) and fall back to `socket.remoteAddress`.
- **Schedule pruning:** call `serviceRateLimiter.prune()` on a `setInterval` (e.g. every window) with `.unref()` so it never keeps the process alive; cap the map size defensively (evict oldest when over a ceiling).
- Keep behavior identical for legitimate traffic.
**Acceptance:** unit test: many requests with distinct spoofed `X-Forwarded-For` but same socket resolve to the same bucket and DO get limited; `prune()` removes expired buckets; map does not grow past the ceiling under a spoof flood.
**Tests:** extend `apps/runtime/src/rate-limit.test.ts`.
**Validation:** full suite.

### T6. Add baseline security response headers to the runtime
**Severity:** MEDIUM (posture; directly comparable security services set these — judges will notice their absence)
**Class:** No runtime response sets `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or a minimal `Content-Security-Policy`. Every JSON response is emitted bare.
**Evidence:** `apps/runtime/src/server.ts` — grep for those headers returns nothing; `writeJson:530-…` and the raw `writeHead` calls set only `content-type`/`cache-control`.
**Change:**
- Add a single `applySecurityHeaders(response)` helper and call it from `writeJson`, `writeRateLimited`, and the two raw `writeHead` sites (the 200 delivery path and the 402/probe path). Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and a tight JSON-only CSP (`default-src 'none'`). These are a JSON API, so the CSP can be maximally strict.
**Acceptance:** every response (200/400/402/404/429/503) carries the header set; a test asserts presence on at least a 200 and a 402.
**Tests:** runtime response test.
**Validation:** full suite.

### T7. Fail fast at boot on missing critical secrets; make `/health` a real readiness probe
**Severity:** HIGH (this is the class behind the past "deployed but broken" outage)
**Class:** OKX x402 keys and `ANTHROPIC_API_KEY` are only required lazily at first paid call (`getX402Server`/`createAnthropicModelClient`). A deploy missing them boots "healthy" and only fails when the first real buyer pays — the buyer eats the outage. `/health` returns `ok:true` with a stale `"t0.2-shell"` status and verifies nothing.
**Evidence:** boot guard at `server.ts:80-82` only covers `MODEL_CLIENT=test-stub`; secrets validated lazily at `:1561-1563` and `anthropic-client.ts:47-51`. `/health` at `server.ts:225-240`.
**Change:**
- At boot (production only), assert presence of the required secret set (`OKX_X402_*`/`OKX_*`, `ANTHROPIC_API_KEY`, and confirm the ledger/archive/quote dirs are writable). Fail the process start with a clear message if any are missing — Railway will surface the failed deploy instead of serving a broken instance.
- Split endpoints: keep `/health` as a cheap liveness `200`. Add `/ready` that checks: required env present, x402 server initializes, ledger path writable, model key present (without calling the model). Return `503` with a per-check breakdown when not ready. Update the stale `"t0.2-shell"` string to a real version/build marker.
**Acceptance:** boot with a required secret unset (production mode) exits non-zero; `/ready` returns `503` with the failing check named when a dependency is misconfigured, `200` when all pass.
**Tests:** a bootable-config unit test for the validator; a `/ready` handler test with injected failing checks.
**Validation:** full suite.

---

## TIER 3 — Correctness/consistency hardening (kill the remaining error classes proactively)

### T8. Rate-limit the GET/402 probe path
**Severity:** MEDIUM
**Class:** `handleTenantServiceProbe` (added for the GET/402 fix) calls `getX402Server()` and builds a 402 challenge on every unauthenticated GET with **no** rate limit, unlike the POST path. Free to hammer.
**Evidence:** `apps/runtime/src/server.ts` — `handleTenantServiceProbe` has no `serviceRateLimiter.check`; POST path guards at `:666`.
**Change:** apply the same `serviceRateLimiter.check` (distinct key namespace, e.g. `probe:<slug>:<ip>`) to the probe path, after the T5 IP fix so it can't be bypassed.
**Acceptance:** GET flood from one client is limited; a normal single validity probe is unaffected.
**Tests:** runtime probe test.
**Validation:** full suite.

### T9. Single source of truth for the tenant catalog (kill catalog drift)
**Severity:** MEDIUM
**Class:** `packages/core/src/tenant-catalog.ts` and `apps/web/src/lib/tenant-catalog.ts` are **independent hand-maintained copies** of price/status/route/category. They *will* drift (this bit us before). The web `category` union even differs in shape from core's domain model.
**Evidence:** both files define `route`/`priceUsd`/`displayAmount`/`status` independently; web copy at `apps/web/src/lib/tenant-catalog.ts:1-…`, core at `packages/core/src/tenant-catalog.ts`.
**Change:**
- Make `@agentforge/core` the single source. Have the web app import the catalog (or a serialized snapshot generated from core at build time) instead of re-declaring it. If a build-time boundary makes direct import hard, add a test that asserts the two catalogs are field-for-field identical so drift fails CI immediately.
- Prefer real de-duplication over a drift-assertion test if the import path is clean.
**Acceptance:** changing a price/status in core is reflected in web (or fails a drift test) without a second manual edit.
**Tests:** a catalog-parity test (or removal of the duplicate + existing web tests still green).
**Validation:** full suite (web + core).

### T10. Generalize the buyer-free-text interpolation guard (the template-seam *class*)
**Severity:** MEDIUM (quality; this is the class behind the repeated "launch copy template seams" reports)
**Class:** The template-seam fixes so far patched specific sentences. The underlying class is "raw buyer free-text (`targetCustomer`, `expertiseArea`, `servicesOffered`) concatenated into a fixed sentence continuation." Any *future* copy template that does this reintroduces the bug.
**Evidence:** `apps/runtime/src/business-builder.ts` — multiple interpolation sites (`:121, :329, :852, :854, :875, :877` and the now-fixed branches). The fix pattern is "buyer clause ends at a period, fixed value-prop is its own sentence."
**Change:**
- Add a single helper (e.g. `buyerClause(text)`) that normalizes buyer free-text into a self-contained clause (trims, ensures it does not fuse with the next sentence) and route **all** copy templates through it.
- Add a lint-style unit test that runs the deliverable builder over a corpus of adversarial buyer inputs (text ending mid-clause, text ending with a period, very long text) across every domain and asserts no double-word seams / no run-ons in `launchCopy.*`.
**Acceptance:** the corpus test catches a reintroduced raw interpolation in any domain.
**Tests:** extend `business-builder.test.ts` with the corpus/property test.
**Validation:** full suite.

### T11. Close the `requested_service_coverage` fuzzy-match blind spot
**Severity:** MEDIUM (quality-gate integrity)
**Class:** A dropped capability thematically close to a domain's boilerplate can pass the fuzzy `containsSignal` match — i.e. the quality gate can still fail-open for near-boilerplate drops.
**Evidence:** `business-builder.ts` `containsSignal`/`significantTokens` (~`:1403-1415`) and the coverage check; limitation is tracked as a follow-up in this hardening plan.
**Change:** strengthen coverage detection for the near-boilerplate case — e.g. require that each buyer-requested service maps to a *distinct* surface element (a service-menu line, a named intake field, or a proof-guidance item), not merely vocabulary overlap with static domain copy. Keep it conservative to avoid false failures on legitimately-bundled services (the PolicyPool case).
**Acceptance:** a dropped "endpoint audit"-style service in an agent-security draft (previously slipped through) is now caught, while the legitimate PolicyPool bundled-coverage cases still pass.
**Tests:** extend `business-builder.test.ts`.
**Validation:** full suite.

---

## TIER 4 — Truth-in-evidence and hygiene

### T12. Refresh stale operational claims
**Severity:** LOW (but judge-visible)
**Class:** Stale hard-coded state that is now false.
**Evidence:** `/health` status string `"t0.2-shell"` (`server.ts:231`); `ops/evidence/2026-07-14-t71-demo-script.md` still says "0 external customers / 0 reviews" though real paid buyers and a 4.7 review now exist.
**Change:** update the health/version marker (ties into T7) and correct the demo script to the real, current, verifiable numbers (pull from the live `/ledger/summary` and the on-chain review tx — do not invent). Keep the honest demo-traffic disclosure discipline.
**Acceptance:** no shipped surface asserts a number that the live ledger/on-chain state contradicts.
**Tests:** n/a (docs); spot-verify against `/ledger/summary`.
**Validation:** manual read.

---

## Suggested execution order & batching for Codex

1. **T1** alone (critical; small, surgical; ship + deploy immediately after).
2. **T2, T3, T4** (reliability core) — can be one working session, three commits.
3. **T5, T6, T7** (security + readiness) — three commits.
4. **T8, T9, T10, T11** (consistency/quality) — batch.
5. **T12** (hygiene) — last.

After **each** tier: run the full validation trio, then push + deploy, then live-verify against production (`/ready`, `/ledger/summary`, `onchainos agent x402-check`). Remember the audit-log publish dance every commit.

---

## Why I believe this is the right plan (self-critique)

- **It fixes classes, not instances.** T1 is the single root cause of every "buyer paid, got an error" report (the specific ledger/archive/GET incidents were symptoms). T10 generalizes the template-seam whack-a-mole into one guarded helper + corpus test. T5 fixes both a bypass and a leak from one root (untrusted XFF).
- **It is ordered by buyer/judge harm,** not by ease. Money-loss and fail-open first; posture and hygiene last.
- **It is grounded, not generic.** Every task cites a line I actually read and verified, not a checklist item.
- **It respects the invariants that already make the product good.** Fail-closed-before-settlement is preserved and reinforced (T1 adds the complementary settled⇒delivered invariant).
- **It is executable without me.** Each task names the file, the change, the acceptance criteria, and the exact test to add.
- **What it deliberately does NOT do** (scope discipline, so Codex doesn't sprawl): no distributed ledger store, no multi-instance infra, no new product surfaces, no model swap without a measured decision (T3/T4 make the *current* model reliable; a Haiku→Sonnet upgrade for deliverable quality is a separate, data-backed decision, not a silent change), no dispute/dashboard features. "Best in niche" here means *undeniably reliable and safe*, which is what a paid-agent buyer and a hackathon judge actually reward — not surface area.

**Residual risk after this plan:** single-instance ledger durability depends on the Railway volume; if that volume is lost, recovery relies on on-chain settlement records + archives. If the user wants true durability, a follow-up task would mirror the ledger to an external append store — intentionally deferred, not forgotten.
