# AgentForge Lessons

No audit findings yet.


## 2026-07-04 — Delisting of #3746 (finding owner: Claude/Auditor)
- **What happened:** AgentForge #3746 delisted by OKX routine review: "actual service does not match its listed description."
- **Root cause:** After `agent create`, the mandatory A2A communication-readiness flow (okx-agent-chat / ensure-okx-a2a-communication-ready — auto-trigger contract) was never run. The listed A2A negotiation service was unreachable — no daemon, no messaging identity. Reviewer verified reality vs listing and correctly failed us.
- **Habit that prevents it:** After ANY create/update/activate of an agent, run the comm-readiness flow in the same session, no exceptions — and never list a service (A2A or A2MCP) whose delivery path hasn't been personally exercised end-to-end first. "Truthful copy" is not enough; the service behind it must be OBSERVABLY live at review time. This is I1 applied to listings: the marketplace is a visible surface.

## 2026-07-13 — AUDIT-3 finding classes (owner: Claude/Auditor)
- **Repo-fixed is not fixed.** An I1 correction (ShieldCheck heartbeat claim) sat committed while
  production kept serving the old claim. The visible surface is what judges and reviewers see —
  a truth fix isn't done until it is deployed and live-verified. Habit: every I1/copy fix ends with
  a deploy + curl of the live URL in the same task, or the task stays IN-PROGRESS.
- **Standing rule skipped twice.** Section commits keep landing while the previous audit is
  unresolved (S1/S2 before AUDIT-0/1; S3 while AUDIT-1 = FAIL). Habit: before a section's first
  commit, read the previous AUDIT row in status.md; if it is not PASS or PASS-WITH-FIXES-in-progress,
  the next commit is the fix, not the feature.

## 2026-07-13 — AUDIT-1 re-check finding class (owner: Claude/Auditor)
- **A gate that grades its own answer key is not a gate.** The live Forge Gate's server responder
  refused whenever the harness's probe metadata said a refusal was expected — the system under test
  was reading the test's expectations. Habit: the service under QA must never receive the probe's
  category, expected behavior, or any harness metadata; it gets only the adversarial input, through
  the same pipeline a paying customer hits. Before citing any eval as evidence, produce one run
  that FAILS — an eval that cannot fail proves nothing.

## 2026-07-13 — Temporary deployer cleanup (owner: Codex)
- **One-time keys need a recovery window until cleanup is verified.** T4.1 deployed successfully
  through a temporary local deployer, but the post-deploy dust-sweep transaction reverted after the
  in-memory deployer key was discarded. Result: `0.00004299499964975` OKB became unrecoverable dust.
  Habit: for future one-time deployers, keep the key in a secure temporary file ignored by git until
  the sweep receipt is verified, then shred/delete it; or use a deployer whose key lifecycle is
  already recoverable. Never discard the only signing key before cleanup success is confirmed.

## 2026-07-13 — Anchor inputs must be independently inspected (owner: Codex)
- **A successful anchor can still anchor the wrong commitment.** The first T4.2 anchor succeeded
  on-chain but used an incomplete AgentSpec snapshot hash because the generator read the wrong JSON
  path. Habit: before any irreversible anchor call, print and inspect the semantic input summary
  (`agent_name`, service count, required evidence refs, caveat), not just hashes and gas estimates.
  If the summary is incomplete, stop before broadcasting.

## 2026-07-14 — Vercel project roots and workspace imports (owner: Codex)
- **A local monorepo build can pass while Vercel remote build fails.** The `apps/web` Vercel project
  root uploads only the web app, so a web dependency on `file:../../packages/core` is unavailable
  remotely even when root-local validation passes. Habit: for this Vercel project, public web code
  must either live inside `apps/web` or the Vercel project root/build config must be changed first
  and proven by a production deploy.

## 2026-07-14 — Paid delivery must prove input fidelity (owner: Codex)
- **A real payment can still produce a weak service experience if the output ignores buyer-specific
  fields.** Foreman settled a valid `0.5 USDT` x402 call but returned generic/default launch material
  instead of the AgentForge-specific body. Habit: every paid generative service needs an output
  fidelity check that confirms the founder/customer/services/boundaries/pricing supplied by the buyer
  appear in the deliverable, or the product must repair/flag the miss before returning it.

## 2026-07-14 — Settlement can precede persistence failure (owner: Codex)
- **A payment path can settle and still fail the buyer response.** Controlled buyer proof #1 against
  `/svc/forge` reached payment handling, then failed while appending the delivered service call
  because the mounted Railway journal still contained duplicate legacy `quoted` rows.
- **Habit that prevents it:** Before any new paid proof, append-time persistence must tolerate known
  non-economic legacy rows while still failing closed on delivered call duplicates, payment-ref
  duplicates, and unbalanced ledger transactions. A clean pre-payment rejection is acceptable; a
  post-settlement 400 without a deliverable is not.

## 2026-07-14 — Boundaries are not service-domain evidence (owner: Codex)
- **A safety boundary can pollute the product output if treated as the service description.**
  RequestDesk AI mentioned private keys, wallet secrets, and payment execution only as things it
  must not do, but the Business Builder used those terms to infer wallet/security buyer intake.
- **Habit that prevents it:** Choose domain-specific intake from positive service facts
  (`expertiseArea`, `servicesOffered`, brand), not refusal boundaries. Boundaries belong in safety
  rules; they should not make an unrelated service look like a wallet-risk product.

## 2026-07-14 — Rule-heavy products need semantic invariants (owner: Codex)
- **A personalized output can still be commercially wrong if it misses the product's governing
  rules.** PolicyPool needed strict distinctions between free preflight, paid receipt fee, coverage
  cap, reserve capacity, SLA-derived deadline, and non-insurance caveats; a generic business package
  blurred those terms.
- **Habit that prevents it:** For specialized services, add domain invariants that assert the
  forbidden drift directly: wrong category, wrong price target, buyer-chosen deadlines, unsupported
  "signed" claims, automatic-settlement language, or coverage beyond job value/policy/reserve.

## 2026-07-14 — Personalization is not operational accuracy (owner: Codex)
- **A deliverable can mention the buyer's fields and still be unusable.** The PolicyPool proof showed
  that input fidelity alone does not protect against wrong money terms, wrong deadline authority,
  unsupported legal/settlement language, or public-copy overclaims.
- **Habit that prevents it:** Each paid builder output needs a visible operational-accuracy gate:
  separate the money model, assert domain rules, scan public claims for forbidden drift, and tell the
  buyer not to publish/reuse the copy until the gate passes.

## 2026-07-14 — Do not expose unrepaired scaffold beside repaired output (owner: Codex)
- **A corrected deliverable can still look wrong if the API response includes contradictory raw
  draft material.** Controlled Buyer Proof #2 showed the final `/svc/forge` deliverable was correct,
  but the response also exposed the intermediate model draft, including unrepaired draft-only details.
- **Habit that prevents it:** Buyer-facing paid responses should return the corrected deliverable and
  a compact audit summary of omitted scaffold. Raw model drafts belong in internal QA/evidence, not
  next to the product a buyer paid to use.

## 2026-07-14 — Do not silently canonicalize away buyer-requested services (owner: Codex)
- **A domain-specific builder can pass semantic rules while dropping a requested service.**
  Controlled Buyer Proof #3 showed the coverage builder correctly handled preflight/receipt rules and
  response shape, but input fidelity failed because a requested marketplace-copy/checklist service was
  not explicitly mapped in the final deliverable.
- **Habit that prevents it:** Paid builder outputs need a requested-service coverage map. If the
  product canonicalizes services into safer domain primitives, show exactly where each buyer-requested
  item was handled, and do not invent a public price for ambiguous packaging work.

## 2026-07-14 — x402 replays need service-level recovery (owner: Codex)
- **x402 paid replay can settle without a platform artifact fallback.** A Business Builder buyer
  reported payment settlement where the replay to `/svc/forge` failed before the buyer received the
  deliverable; `onchainos agent deliver` is escrow-only and cannot deliver x402 artifacts after the
  fact.
- **Habit that prevents it:** Every x402 parameterized service must return a recovery handle, persist
  a private response archive after successful settlement, expose a recovery endpoint keyed by paid
  reference plus original-body proof, and document the manual make-good/refund path for replays that
  never reached the endpoint.

## 2026-07-15 — Empty-body OKX task replays need quote binding (owner: Codex)
- **A correct parameterized endpoint can be unreachable through a buggy task replay.** A private buyer test
  showed an OKX task payment client could send `{}` during replay even when the buyer supplied a
  valid business body. Weakening validation would protect reviews but break the product.
- **Habit that prevents it:** Parameterized paid endpoints need a pre-payment quote token that binds a
  validated body to the paid endpoint URL. Empty replay is recoverable only through that token; bare
  `{}` remains a pre-payment rejection.
