# AgentForge — external six-angle review · 2026-07-14 · reviewer: Claude (Fable 5)

Method: repo read at `e88a053`, live probing of the Railway runtime and Vercel web, Railway
deployment metadata, on-chain checks carried from AUDIT-4/5. Every claim below is backed by repo
evidence, a live response, or explicitly labeled NOT PROVEN.

Overall verdict: **PASS-WITH-FIXES**. The security spine is genuinely strong and the provenance
story is the best asset on the table. But the product is **NOT ready for more external customers
today** — two blockers (stale deploy of the anti-generic fix; no cold-buyer proof + no abuse
protection on a public paid endpoint). Both are ~1 day of work plus 1–2 approved payments.

---

## 1. Security architecture audit — PASS-WITH-FIXES

### Verified strengths (live)
- Internal routes all reject unauthenticated: `POST /internal/interview-draft`, `/internal/forge-gate/:t`,
  `/internal/forge-gate-live/:t`, `/internal/forge-gate-fixture/leaky` → **401**; QA header on a paid
  route without token → **401**. Bearer compare is `timingSafeEqual` (server.ts:1061).
- Payment is server-side (OKX facilitator `processHTTPRequest`/`processSettlement`); forged
  `X-PAYMENT` → 402 (AUDIT-5); deliverable is built then settled, and a failed settlement returns
  before any ledger write (server.ts:594).
- Invalid body rejected **before** payment with field guidance (400); 16KB body cap → oversized → 400
  (server.ts:1231); malformed JSON → 400.
- Ledger integrity on every append (duplicate ids, duplicate delivered payment ref, balance) —
  journal.ts; dashboard/guild read the live journal off the mounted `/data` volume.
- Secrets only via `requireEnv`; targeted scan (`sk-ant-api`, long bearers, PEM) across repo = clean;
  CI runs gitleaks + `npm audit` (.github/workflows).
- `cache-control: no-store` on all JSON; `NODE_ENV=production` refuses a test-stub model client
  (server.ts:56).

### Findings

**S-1 · HIGH · Deployment mismatch: the anti-generic fix is not live.**
Files/routes: `apps/runtime/src/business-builder.ts`, `/svc/forge`.
Evidence: last Railway deploy `c339d63c` (2026-07-14T11:46Z, `cliMessage: AUDIT-5 status evidence
fix d0cc93b`). `git show d0cc93b:apps/runtime/src/business-builder.ts | grep -c inputFidelity` → **0**.
Commit `e88a053 [runtime] enforce AgentForge input fidelity` (12:51Z) is pushed but **unshipped**.
So production still returns deliverables with no fidelity repair — the exact class the patch targets.
Fix: deploy the runtime to Railway and live-verify a delivered payload contains `inputFidelity`.
Acceptance: a real (or QA) delivered `/svc/forge` response includes `deliverable.inputFidelity` with
`matchedFields`/`repairedFields`; deploy commit ≥ `e88a053`.

**S-2 · HIGH · Unauthenticated ledger-write amplification + no rate limiting.**
Files/routes: `server.ts:536-563` (quote path), `packages/payments/src/journal.ts` (append), all `/svc/:t`.
Every unpaid POST to a callable tenant writes a `quoted` service_call row to the persistent journal —
no auth, no payment. `appendLedgerJournal` re-reads the **entire** journal and runs a full integrity
pass on **every** append → O(n) per request, O(n²) over time, unbounded disk growth, climbing latency.
There is **no rate limiting anywhere** in the runtime (grep: none). Anonymous flooding degrades the
runtime and bloats the ledger the public dashboard reads. Verified live: 6 concurrent unpaid POSTs all
returned 402 and each wrote a quote row.
Fix: (a) do not persist a quote row for every anonymous unpaid hit — gate quote-writes (e.g. only after
a valid payment-attempt, or move quote metering to memory and persist only delivered rows); (b) add
per-IP rate limiting (429) on `/svc/:t`; (c) bound the journal or index it instead of full re-read.
Acceptance: N unpaid POSTs add 0 unbounded persistent rows; >R req/s/IP → 429; append is not O(n).

**S-3 · MEDIUM · Quote-id millisecond collision → self-inflicted 503 for a real buyer.**
Files: `packages/payments/src/index.ts:305` (`serviceCallIdForQuote` = digits-only ms timestamp),
`journal.ts:74` (duplicate id rejected). Two quotes in the same millisecond collide → integrity check
throws → the second legitimate buyer gets `503 ledger_unavailable` mid-quote. This nit was flagged at
AUDIT-2/3 and is now load-bearing because the integrity check is strict.
Fix: make the quote id unique (add a random suffix / counter). Acceptance: 1000 same-ms quotes produce
1000 distinct ids; no 503 under burst.

**S-4 · MEDIUM · Customer-privacy boundary is discipline, not code.**
The runtime returns the deliverable inline (correct) and does not itself write buyer input to public
evidence. But past deliverables were committed to the public repo (`first-heartbeat-deliverable.json`
contains a full deliverable). For a real cold buyer, input + output are private. Nothing in code
prevents a future commit of a stranger's private input/output.
Fix: written rule in AGENTS.md — buyer input/deliverable is private; it becomes public evidence only
with explicit buyer consent, redacted otherwise. Add a pre-commit/checklist gate. Acceptance: rule
exists; a documented redaction procedure; no un-consented buyer content in evidence.

**S-5 · LOW · Live-gate endpoint can be host-header-derived (SSRF-shaped, but auth-gated).**
`resolveLiveForgeGateEndpoint` (server.ts:1196) falls back to `x-forwarded-host`/`host`. Route is 401
without the QA token, so exposure is low. Fix: pin to an allowlist / `AGENTFORGE_PUBLIC_RUNTIME_URL`.

**S-6 · LOW · Public `/ledger/summary` exposes payer addresses + tx hashes.**
Intentional transparency and currently only the project wallet, but confirm no real buyer address or
referral PII is ever surfaced once cold buyers arrive. Fix: whitelist fields in the summary DTO.

---

## 2. Service-rendering / customer-satisfaction audit

Skeptical-buyer question: *if I pay AgentForge, do I get something specific and useful, or generic?*

### What AgentForge can truthfully claim TODAY
- A **deterministic, buyer-field-bearing deliverable**: positioning (customer/promise/category),
  a service menu with per-service buyer inputs + output format, launch copy (profile bio, marketplace
  description, first post), operating rules (refusal + out-of-scope), and next actions. Verified in the
  one real paid deliverable (`first-heartbeat-deliverable.json`) — it was genuinely ShieldCheck-specific,
  not boilerplate.
- The pipeline is real: buyer input → live Anthropic draft (`createAgentSpecDraft`) → deliverable
  assembled from the draft **and repaired from buyer input** (business-builder.ts) — in the repo.
- A **generic-draft fallback + repair** path exists (`buildServiceMenu` fallback, `evaluateDraftFidelity`)
  so a thin model draft is backfilled from the buyer's own words. This is the right answer to the
  Foreman 2.5/5 lesson — **but see S-1: it is not deployed.**

### What it must NOT claim yet
- **"Pricing plan"** — the live listing description promises "…service menu, pricing plan, and launch
  copy." The deliverable has per-service `priceUsdt` and a "set price after a real call" next-action,
  but **no distinct pricing-plan section** (`has pricing plan? False`). Either add one or soften the
  listing copy. This is a public, falsifiable overclaim — same class as the Jul 4 delisting.
- **"Proof/receipt guidance"** is not inside the deliverable (`proof/receipt guidance? False`).
- **"Won't be generic"** — unprovable until a cold-buyer call runs against the *deployed* fidelity fix.

### What would disappoint a buyer
- Only **one** paid `/svc/forge` call has ever happened, and it was the founder's own (not cold).
  **NOT PROVEN: no external cold buyer has tested the paid product.** The Foreman purchase proves the
  general risk — real settlement, generic output, fair 2.5/5.
- On the currently-live runtime, a cold buyer gets the **pre-fidelity** deliverable.

### Is one live cold-buyer call enough?
No. Necessary but not sufficient. Do it **after** deploying `e88a053`, and run **2–3 varied domains**
(not security) to show it isn't generic across inputs, with **human review before any rating**.

---

## 3. Whole-project product review

**Strongest — emphasize:** the provenance/verifier chain (5 independently hash-verifiable on-chain
anchors, honest ladder, real x402 rail, balanced double-entry ledger). This is the moat and the demo.
No fast-follow can retroactively manufacture dated on-chain evidence.

**Improve:** deploy discipline (a repo-vs-prod gate before any "done"); add the pricing-plan section;
get one cold-buyer proof; reconcile Launch Kit status drift (catalog `heartbeat` vs storefront
"soft-launch transition pending").

**Remove / hide until proven:** referral program is live in the API with **0 real referral calls** —
keep it, but do not foreground it. Templates / cross-test / launch-engine are scaffolding with **0
external reviews** — keep, don't emphasize; they read as breadth where the win is depth.

**Overbuilt:** the entire T5 surface relative to zero external customers. It's M2-optional.
**Underbuilt:** cold-buyer proof, abuse protection, the pricing-plan deliverable section.
**Confusing:** three tenants at three ladder states with similar copy — a buyer may not know that
**AgentForge `/svc/forge` is the product** and ShieldCheck/Launch Kit are demos of what it produces.
Make that hierarchy explicit on the storefront.
**Risky:** S-1 (stale anti-generic fix) + S-2 (unauthenticated write amplification) on a public paid
listing.

---

## 4. Executable plan

### Phase A — Must fix before more customers
- **A1 · Deploy the input-fidelity runtime** — Owner: Codex. Why: S-1, the anti-generic fix is not live.
  Work: deploy Railway from ≥`e88a053`; confirm `/health` and volume mount. Acceptance: a delivered
  payload (QA or real) contains `deliverable.inputFidelity`. Validate: `railway deployment list` shows
  new deploy > `e88a053`; live QA `/svc/forge` shows the field. Evidence: `2026-07-14-a1-fidelity-deploy.md`.
  Done: production commit ≥ e88a053 and field present.
- **A2 · One real cold-buyer `/svc/forge` proof (×2–3 domains)** — Owner: Human (payment) + Codex (run/record).
  Why: NOT PROVEN the paid product is non-generic for strangers. Work: after A1, run 2–3 varied-domain
  paid calls; **human review before any rating**; archive input+deliverable (consent/redaction per A4).
  Acceptance: each deliverable reflects that call's buyer fields (`inputFidelity.passed` true or
  repaired), no generic fallback drift. Validate: on-chain payment tx + `/ledger/summary` increment +
  receipt. Evidence: `2026-07-14-a2-cold-buyer-proof.md`. Done: ≥2 non-founder-domain proofs archived.
- **A3 · Fix the listing "pricing plan" overclaim** — Owner: Codex (deliverable) + Human (listing copy).
  Why: public falsifiable claim. Work: either add a `pricingPlan` section to the deliverable (launch
  price, step-up rule, per-service rationale) or soften listing copy to match. Acceptance: listing
  words == deliverable sections. Evidence: `2026-07-14-a3-pricing-plan.md`.
- **A4 · Customer-privacy rule (S-4)** — Owner: Auditor (rule) + Codex (gate). Why: protect cold-buyer
  data. Work: AGENTS.md rule + redaction/consent gate before any buyer content enters evidence.
  Acceptance: rule live; no un-consented buyer content committed. Evidence: AGENTS.md diff.

### Phase B — Product quality hardening
- **B1 · Deliverable pricing-plan + proof-guidance sections** (folds A3) — Owner: Codex. Acceptance:
  deliverable contains a pricing plan and a "how to prove your first call" block; tests assert presence.
- **B2 · Reconcile Launch Kit status drift** — Owner: Codex. Why: catalog `heartbeat` vs storefront copy.
  Work: single source of truth via `assertStatusTransition` (AUDIT-5 finding 1 class). Acceptance:
  `/svc/launch-kit`, `/a/launch-kit`, `/ledger/summary` agree. Validate: live diff.
- **B3 · Storefront hierarchy** — Owner: Codex/UX. Make `/svc/forge` the hero; label ShieldCheck/Launch
  Kit as "made by AgentForge" examples. Acceptance: a first-time visitor can name the product in 5s.

### Phase C — Growth / customer readiness
- **C1 · Anchor the Launch Kit receipt** (closes "Anchor pending") — Owner: Human (approve) + Codex.
  Validate: `hasAnchor` true on-chain. Evidence: update `launch-kit-heartbeat-receipt.json`.
- **C2 · One real non-founder cross-test review (0→1 honestly)** — Owner: Human + Codex. Only after A2.
  Acceptance: review backed by a real receipt + matching ServiceCall id; count reflects reality.
- **C3 · Founder #2 recruitment** (H4) — Owner: Human. Parallel; nothing depends on it for M2.

### Phase D — UI/UX polish
- **D1 · Product hierarchy + "verify it yourself" CTA** — Owner: UX. Surface the recompute-hash →
  read-anchor flow on `/verify` and `/judges` (it's the moat). Acceptance: a stranger can verify one
  anchor from the UI without docs.
- **D2 · Consistent status/caveat components** across storefronts. Acceptance: one component, four states.

### Phase E — Security hardening
- **E1 · Rate limiting + gate quote-writes (S-2)** — Owner: Codex. Acceptance: 429 over threshold; no
  unbounded persistent rows from anonymous hits. Validate: burst test.
- **E2 · Unique quote id (S-3)** — Owner: Codex. Acceptance: no same-ms collision; burst test green.
- **E3 · Pin live-gate endpoint allowlist (S-5)** + **summary DTO field whitelist (S-6)** — Owner: Codex.

### Order, dependencies, parallelism
- **Blocking chain:** A1 → A2 → C2 (a real cold call must precede any review). A4 must land **before**
  A2 (protect the first cold buyer's data). A3/B1 should land before A2 so the proof shows the fixed copy.
- **Parallel now:** E1/E2/E3 (independent), B2/B3/D1/D2 (web-only), C1 (one approved tx), C3 (human).
- **Must be live-verified:** A1, A2, B2, C1. **Needs real payment:** A2, C1 (and C2's underlying call).
  **Human approval:** A2, A3 (listing), C1, C2, C3. **Wait until proven:** foregrounding referral/
  templates/cross-test until real volume exists.

### Codex execution refinement
- Treat provenance as AgentForge's strongest trust asset, not a substitute for useful paid output.
  The buyer still has to feel that `/svc/forge` understood their business and returned something
  immediately usable.
- Do not persist anonymous unpaid quote rows into the durable economic ledger. The durable ledger
  should prioritize settled economic events; if quote metrics are needed, use bounded in-memory
  counters, sampled analytics, or another bounded store.
- Fix rate limiting, quote-write gating, and unique quote ids **before** inviting cold-buyer traffic.
  Controlled proof calls are acceptable only after A1/A3/A4 and with explicit human approval.
- Make `/svc/forge` the main product in planning and UX. ShieldCheck and Launch Kit are examples made
  by AgentForge; templates, referrals, cross-test, and launch-engine stay secondary until real usage
  exists.
- Cold-buyer proofs must be controlled, varied-domain, and human-reviewed before any rating/review is
  submitted or relied on publicly.
- Add a production-done rule to future work: no task is DONE until the deployed production surface
  matches the intended commit and live verification proves the user-visible behavior.

---

## 5. Go / No-Go

**Ready for more external customers now? NO.**

Minimum checklist before yes:
1. A1 deployed + live-verified (fidelity fix actually running).
2. A2: ≥2 varied-domain cold-buyer proofs, human-reviewed, non-generic.
3. E1 + E2: rate limiting + quote-write gate + unique quote id on the public paid endpoint.
4. A4: customer-privacy rule in force.
5. A3: listing "pricing plan" claim matches the deliverable.

Fastest path to genuinely good-to-go: **A1 → (A3/B1, A4 in parallel) → A2 → E1/E2**. Roughly one Codex
day plus 2–3 approved micro-payments. Everything else (C/D, T6 recruitment) is upside behind proof.

**Biggest trust risk if ignored:** a stranger pays `/svc/forge` on the live listing and receives the
**pre-fidelity, possibly generic** deliverable (S-1) → a fair low public rating, exactly the Foreman
2.5/5 outcome — on your own listing, hard to undo. That single event damages the "verified,
revenue-ready" narrative more than any missing feature. Deploy the fix and prove it cold **before**
inviting anyone.
