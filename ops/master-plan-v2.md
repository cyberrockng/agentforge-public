# AgentForge — Master Executable Plan V2 (Post-Listing War Plan)
### OKX.AI Genesis Hackathon · revised Jul 6, 2026 (evening) · Target: Overall #1
> **V2 supersedes the Jul 2 V1 in strategy sections; V1's invariants, demo doctrine, submission assets, and success metrics remain in force.** The Buildbook (`AgentForge-Executable-Buildbook.md`) remains the execution document — this plan re-aims it. Codex: start at §6 (Directive Block).

---

## 0. What changed since V1 (facts, verified Jul 6)

| Fact | Evidence | Consequence |
|---|---|---|
| **AgentForge #3746 is LISTED** — passed OKX review, visible + searchable, eligible for recommendation | OKX email Jul 6; relist commit `f27cf10` | M1 achieved AND review cleared. Eligibility secured 9 days early. Everything now compounds on a LIVE listing |
| **First Heartbeat delivered** — real 1 USDT paid call end-to-end | commit `d27b30b` | T3.1's hardest half is done; payment rail is real |
| **We were delisted once and solved it** — A2A comm-readiness must run after create | commit `c54fd86`, `ops/lessons.md` | Proprietary ops knowledge nobody in the queue has. Productize it (§2·S4) |
| **The idea is now public** — listing is searchable; a waitlisted competitor already searched it to study why we got listed first | User report Jul 6 | Copycat risk upgraded LOW → HIGH. Counter-strategy in §1 |
| **Repo was public — now PRIVATE as of Jul 6** | github.com/cyberrockng/agentforge | Buildbook/ops/lessons no longer readable by competitors. Re-public at M2 (Jul 15) with the submission |
| **`ops/status.md` is stale** — says M1/T3.1 TODO while git shows them done | ledger vs git log | Codex task T-A: reconcile before anything else |

**Platform facts from OKX Discord/FAQ (Jul 6):**
1. **Review queue is backlogged** — "team is reviewing all the ASPs... high volume" (Chenyang). Waitlisted competitors face days of latency we no longer face.
2. **One wallet can create multiple ASPs** (Darrel, OKX Web3). The factory can legitimately register multiple ASP identities.
3. **ASPs cannot be deleted** — "discard and create a new one" (Darrel). Listings are permanent records; naming and copy must be right the first time.
4. **Approval is inconsistent** — one builder's registration failed then auto-approved (banmao). Never bet a deliverable on review latency or predictability.
5. **X Cup campaign runs in parallel** — https://web3.okx.com/xlayer/build-x-series (Chenyang). Possible second visibility/prize surface.
6. **Demand signal:** builders in Discord are stuck on listing ("stuck on Listing under review", failed registrations, asking staff to delete IDs). Getting listed correctly is a real pain point — and we are the ones who solved it twice.

---

## 1. Revised threat model — and why the window is ours

**The threat, stated honestly:** the idea is no longer secret. Anyone on the waitlist can read our listing, copy the concept, and — being unburdened by our scope — potentially build something flashier.

**Why the copycat still loses, IF we execute this plan:**

| What a copycat needs | Their cost | Our position |
|---|---|---|
| An approved listing | Days–weeks in a backlogged queue, with inconsistent review | **Live now.** Every day they wait, we compound |
| Real transaction history + ratings on the listing | Cannot start until listed; cannot be faked | Heartbeat done; volume starts Jul 7 |
| Working pay-per-call rails | The hard 30% everyone skips | Real 1 USDT call already settled |
| On-chain provenance experience | Weeks of learning curve | ZK AidShield (Groth16/Soroban) + CitePay (Arc anchoring) already shipped |
| The delisting/comm-readiness lesson | They'll hit it blind and lose days | Solved, documented, and about to be productized |
| Recruited real founders | Cannot be prompted into existence | H4 in motion |

**Doctrine change:** V1's moat was partly *the idea being novel*. V2's moat is **accrued, unfakeable, on-listing evidence** — transactions, reviews, ratings, provenance anchors, and real founders — compounding daily on a listing that is already live while every rival sits in queue. From today, the plan optimizes for **evidence velocity**, not secrecy. Secrecy is only maintained where it's free (private repo, no roadmap in public copy).

---

## 2. Strategy shifts (deltas from V1 — everything else stands)

**S1 · Evidence compounding starts NOW, not at soft-launch — and the trail is PUBLIC.**
The listing is live and rateable. Every real paid call, review, and provenance anchor from tonight onward is judging-window evidence a later-listed copycat mathematically cannot match. Traction ops (Buildbook S6) moves from "Jul 10–16, parallel" to **"Jul 7–16, parallel, daily quota"**: every day must add ≥1 new real transaction and pursue ≥1 review until founders take over the volume.
**Public `/proof-log` page (V2.1, from Codex):** the daily evidence ledger is a judge-facing product surface, not a private ops file — dated entries with listing status, paid-call tx refs, receipt counts, review counts, anchor txs, founder go-lives. Judges see momentum, not claims. S5 filter applies: outcomes only (hashes, counts, dates), never mechanics — the log must never read as a build guide.

**S2 · Category occupation via multiple ASP identities.**
Platform-confirmed: one wallet, multiple ASPs; queue is slow. Therefore **register spawned-agent ASP identities EARLY** — submit 2–3 into the review queue as soon as each passes Forge Gate (target: first by Jul 9), so they exit review *before judging* instead of being requested at the end. While queued, they run as sub-services under the approved AgentForge listing (V1's G0 fallback becomes the **interim architecture by design**, graduating agents to their own identities as approvals land). This also physically occupies the "agent factory" shelf on the marketplace before imitators arrive. Quality bar: only Forge-Gate-passing agents get registered — no spam listings (they're permanent, fact #3).

**S3 · Protect the approved listing like infrastructure.**
It cannot be deleted, re-review is unpredictable, and it is our eligibility. Rules: (a) **no edits to the live AgentForge listing before judging** unless fixing something materially wrong; (b) any risky change pattern is tested on a secondary ASP identity first; (c) manage settings only through the Agent conversation interface per the approval email; (d) comm-readiness check runs after every create/update — codified in ops, never manual memory.

**S4 · Turn the waitlist into customers — ship the "Launch Kit" agent FIRST.**
The Discord is a live demand feed: stuck listings, failed registrations, confused builders. V1 already planned a Launch Kit agent (§6.2); V2 makes it **tenant #1 on the multi-tenant runtime** (before recruited-founder agents) because: (i) we hold proprietary knowledge — the comm-readiness delisting root cause, the registration field constraints from R1 recon, the discard-don't-delete rule; (ii) its customers are the exact people studying our listing — **the copy threat becomes the revenue funnel**; (iii) it's self-forged, so no founder-recruitment dependency blocks it. Scope: listing-copy review, registration-flow checklist, comm-readiness verification guide, "why you got delisted" diagnosis, **delisting-recovery walkthrough, and proof-bundle prep for their own submissions** (V2.1 scope from Codex). Clearly labeled as forged and operated by AgentForge (honesty invariant I-series applies). Sell it in the hackathon Discord/channels without revealing factory internals.

**S5 · Information discipline (cheap secrecy only).**
Repo private until M2 (re-public Jul 15 with the submission if judging requires source). Listing copy and storefronts sell *outcomes* ("become a live, verified, earning ASP in minutes"), never *mechanics* (no pipeline diagrams, no Forge Gate internals, no roadmap in public surfaces). Evidence pack stays private until submitted. Do NOT try to hide what's already public — the concept is out; velocity is the response.

**S6 · Pull provenance forward.**
Birth certificates + receipts (Buildbook S4, was Jul 10–11) start **Jul 8** in parallel with runtime work: it's cheap for us (X Layer anchor ≈ 1–2 days given prior art) and expensive for imitators, and "born on-chain, verify yourself" on every storefront is the visible differentiator a fast-follow can't fake. Groth16 remains a stretch upgrade, never a dependency.

**S7 · X Cup cross-visibility (small bet, 30 min).**
Check https://web3.okx.com/xlayer/build-x-series eligibility for AgentForge/X Layer work already done. If compatible, one extra submission surface for the same build. Do not let it distort scope.

**S8 · Positioning language rule (V2.1, from Codex).**
In every public and judge-facing surface — listing copy, X post, Google form, demo narration, Discord replies — **never argue priority or originality** ("we had the idea first", "others copied us"). Always enumerate evidence instead: *"AgentForge already has approved listing history, a real paid heartbeat, proof receipts, a founder pipeline, and launch infrastructure."* Priority claims invite debate; evidence ends it. Any drafted copy that leans on being-first is rewritten before it ships.

**S9 · Horizontal factory proof — the Guild is the thesis made visible (V2.1, from Codex; reality-mandate bounded).**
The winning mechanism remains V1's: *AgentForge is not one agent — it creates agent businesses.* Copycats will copy "an agent"; the counter-proof is 3–5 live agent pages, each with storefront, receipts, verification score, and launch post. Constraint that CANNOT bend: founder pages appear only as fast as REAL founders exist (no thin or fabricated founders — this exact shortcut was rejected once already). The honest accelerators: (a) self-operated agents (Launch Kit + one template-derived agent) count on the Guild **clearly labeled "forged and operated by AgentForge"**; (b) H4 recruitment fills real founders by G2 (Jul 13). Target: ≥3 live agent pages by Jul 10 under these labels, ≥3 real external founders by Jul 13 per G2.

---

## 3. Recalibrated calendar (Jul 6 evening → Jul 17)

Hard milestones unchanged: **M2 = X post + Google form Jul 15** (deadline Jul 17 23:59 UTC — never submit deadline day). Gates: **G1 (payments) is effectively passed** — formalize the ruling. **G2 (Jul 13, ≥3 real founders)** unchanged.

| Day | Focus | Non-negotiable output |
|---|---|---|
| **Jul 6 (tonight)** | Reconcile + protect | Ledger matches reality (T-A); repo private ✅; listing-protection rules in ops/decisions.md; this V2 committed to ops/ |
| **Jul 7** | Runtime critical path + first evidence | T2.1 multi-tenant runtime (registry, router, metering); ≥1 new real paid call on the live listing; G1 ruling recorded with heartbeat evidence |
| **Jul 8** | Launch Kit + provenance start | Launch Kit agent (S4) drafted through interview→spec→Forge Gate; T4.1 ForgeAnchor deployed to X Layer testnet-or-main per H2 funding |
| **Jul 9** | Ladder + first spawned registration | Launch Kit live as tenant #1 through full ladder (Gate→Heartbeat→soft); **its ASP identity submitted to OKX queue (S2)**; T3.2 ledger+split engine |
| **Jul 10** | Dashboard + certificates + proof log | T3.4 founder dashboard (ledger-backed only); T4.2 birth certificates anchored, verifier page live; **public /proof-log live (T-I), backfilled to Jul 6**; ≥3 agent pages live per S9; sell Launch Kit in hackathon channels |
| **Jul 11** | Templates + referral | T5.1 five templates; T5.2 referral loop; T4.3 receipts on every non-QA call; Guild page with real data only |
| **Jul 12** | Founder sprint | Founders #2–#4 forged through full ladder (H4); second spawned ASP into queue; first customer calls to each |
| **Jul 13** | **GATE G2** | ≥3 real founders live and earning, or execute V1 fallback (2 founders + own agents clearly labeled); cut COULD-tier |
| **Jul 14** | Demo day | ≥5 live rehearsals, ≥3 filmed live takes (V1 §4 doctrine unchanged); **judge bundle page live (T-J)**; repo re-public prep (scrub check) |
| **Jul 15** | **M2 — SUBMIT** | X post #OKXAI + demo; founders amplify within the hour; Google form submitted; repo public again |
| **Jul 16** | Revenue sprint | Promos, founder pushes, review solicitation on every satisfied call |
| **Jul 17** | Buffer | Fixes only; evidence pack archived; agents keep earning through judging |

**Daily operating rule (unchanged) + one addition:** every day ends with a submittable product, **and every day adds at least one new piece of on-listing evidence** (transaction, review, anchor, or founder).

---

## 4. Updated risk register (deltas only — V1 table otherwise stands)

| Risk | L | Impact | Kill-switch |
|---|---|---|---|
| Copycat clones concept from listing | **H** (was L) | Medium | §1 doctrine: evidence velocity + queue arbitrage; S2 category occupation; S5 discipline. Do not respond by feature-sprawling |
| Live listing damaged by an edit / re-review loop | M | **Fatal** | S3 rules: freeze risky edits, test on secondary ASP, comm-readiness codified |
| Spawned-ASP registrations stuck in queue past judging | M | Low (by design) | S2 interim architecture: they run as sub-services regardless; approvals are upside, not dependency |
| Launch Kit gives away factory internals | L | Medium | Scope reviewed against S5 before public; sells checklists + diagnosis, not architecture |
| Ledger/status drift misleads execution (already happened) | M | Medium | T-A now; Buildbook rule reaffirmed: no task DONE without ledger update in the same commit |

---

## 5. What did NOT change (binding)
- **No-simulation invariant** — production only, graduated exposure, all evidence real. Non-negotiable everywhere, including Launch Kit and Discord marketing claims.
- Live ≤90s demo doctrine (V1 §4), submission assets (V1 §7), success metrics (V1 §9), eligibility checklist (V1 §10), AVOID list (V1 §2.5).
- The Buildbook's execution protocol, audit gates (Part C), security architecture (A7), and craft bar (A8).

---

## 6. CODEX DIRECTIVE BLOCK — execute in this order

> Protocol: Buildbook A3 applies (ledger-first, audit boundaries, evidence files). Wallet auth and listing click-throughs remain HUMAN-ONLY. Never touch the live AgentForge listing configuration (S3) — prepare packages; the user submits.

- [ ] **T-A · Reconcile `ops/status.md` with git reality** (30 min). Mark done-with-evidence: M1 (`a8caa11`+`f27cf10`+approval email), T3.1 First Heartbeat (`d27b30b`), listing APPROVED Jul 6. Record in `ops/decisions.md`: G1 ruling = direct x402 paid path PROVEN (heartbeat evidence); repo-private decision + re-public date Jul 15; S3 listing-protection rules. Append the six platform facts (§0) to `ops/decisions.md#platform-facts`. Commit as `[V2] reconcile ledger to post-listing reality`.
- [ ] **T-B · T2.1 Multi-tenant runtime** (Jul 7, critical path — everything queues behind this). Tenant registry, per-tenant isolation (persona/pricing/knowledge), request router, usage metering, per-tenant MCP/HTTPS endpoint. Accept: 2 test tenants isolated on the deployed Railway runtime, metered, zero cross-talk; evidence file with curl transcripts.
- [ ] **T-C · T1.4 Forge Gate on the live endpoint** (Jul 7–8). Evals hit the REAL deployed tenant endpoint via zero-priced QA calls. Accept: failing agent is blocked from public; passing run stored as evidence.
- [ ] **T-D · Launch Kit agent as tenant #1** (Jul 8–9, per S4). Source material: `ops/lessons.md` (comm-readiness root cause), R1 registration facts, Discord facts §0. Interview→AgentSpec→Forge Gate→Heartbeat→soft-launch, full ladder, honestly labeled "forged and operated by AgentForge". Accept: publicly callable, paid path works, first real customer call logged. Prepare (do not submit) its ASP registration package → hand to user (H-series) for click-through same day (S2).
- [ ] **T-E · T3.2 double-entry ledger + split engine** (Jul 9). Balanced-entries invariant tested; founder/Forge split computed on the heartbeat and every subsequent call retroactively verified.
- [ ] **T-F · T4.1+T4.2 ForgeAnchor + birth certificates** (Jul 8–10, parallel with T-B/T-D per S6). Minimal anchor contract on X Layer; certificate = commitment(agent ID, founder ID, AgentSpec hash) + heartbeat tx ref; public `/verify/[id]` page. Reuse CitePay/AidShield patterns. Accept: Launch Kit's certificate verifiable from a clean browser.
- [ ] **T-G · T3.4 dashboard + T4.3 receipts + T4.4 Guild** (Jul 10–11). Ledger-backed numbers only; receipts on every non-QA call; Guild shows only real founders/agents.
- [x] **T-H · T5.1 templates + T5.2 referral** (Jul 11). DONE as of 2026-07-14: five templates including the Launch Kit-derived one; allowlisted referral credits now balance in the ledger by debiting Forge revenue and crediting referral payable.
- [x] **T-I · Public `/proof-log` page** (Jul 10, with T-G; per S1). DONE as of 2026-07-14: `/proof-log` renders daily public proof entries from Jul 6-14 with verifier/transaction links, quiet-day caveats, and no internal planning-doc links.
- [x] **T-J · Judge bundle page** (Jul 14, before H5 filming). DONE as of 2026-07-14: `/judges` assembles listing #3746 context, delisting-recovery narrative, receipts, Guild, dashboard, `/proof-log`, `/verify` links, and launch-post handoff caveats. **Excludes all internal planning documents (S5).**
- [ ] **Daily (S1):** append the day's entry to the proof-log data file (which also serves as `ops/evidence/traction-log.md`) — new transactions, reviews requested/received, anchors written. A day with an empty entry is a failed day.

**Human-only queue (surface to user each session):** H2 wallet funding status (now only for optional project-subsidized proof calls and X Layer anchoring; T3.1/R3 payment proof is already done) · H4 founder recruitment (G2 depends on it, 7 days out) · Launch Kit ASP click-through when package ready · S7 X Cup eligibility check (30 min) · H5–H7 unchanged (Jul 14–15).

---

*Update this document at every gate and milestone. V1 archived in git history of ops/ once committed there.*

**— V2 doctrine in one line: they can copy the idea, but they cannot copy a head start that compounds daily on-chain. Outrun them in the only currency judges can verify: real evidence. —**
