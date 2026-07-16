# AgentForge Decisions

## Pre-Verified Facts

Source: Codex recon on July 2, 2026, copied from `AgentForge-Executable-Buildbook.md` Section 0 during T0.1.

- OKX.AI has three roles: User, ASP, Evaluator.
- OKX.AI has two revenue modes:
  - A2MCP: standardized MCP/API, pay-per-call, instant settlement. This is AgentForge's primary rail.
  - A2A: negotiated escrow work. This is COULD-tier only.
- ASP registration is real.
- A2MCP registration fields include service name, description, price per call, and public HTTPS endpoint.
- Localhost is insufficient for A2MCP; runtime must be public over HTTPS.
- Marketplace review SLA is approximately 2 business days.
- Onchain OS Payments supports X Layer, HTTP 402 pay-per-call flow, SDK `@okxweb3/mpp`, and pay-as-you-go billing.
- The local npm registry check for `@okxweb3/mpp` timed out during recon and must be rechecked at T0.2.
- X Layer is EVM-compatible and has OKB gas, docs, explorer, and faucet.
- Model IDs `claude-fable-5` and `claude-haiku-4-5-20251001` were verified as valid in Anthropic docs.
- The exact hackathon Google Form URL was not found via search; resolve and record before July 14, 2026.

## Source Links

- OKX.AI overview: https://web3.okx.com/onchainos/dev-docs/okxai/what-is-okxai
- ASP quickstart: https://web3.okx.com/onchainos/dev-docs/okxai/asp
- ASP registration: https://web3.okx.com/onchainos/dev-docs/okxai/registerasp
- A2MCP guide: https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- Payments overview: https://web3.okx.com/onchainos/dev-docs/payments/overview
- X Layer docs: https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer
- Anthropic model docs: https://platform.claude.com/docs/en/about-claude/models/overview

## Gate Decisions

### G0

Status: DONE.

Pre-check returned `canCreate:true`, `aspCount:0`, and `uniqueness:"multiple"`.

Final ruling:

- One wallet can hold multiple ASP identities.
- Each ASP identity can hold multiple services.
- Spawned agents launch by default as services under the AgentForge ASP identity.
- Mature spawned agents can graduate to their own ASP identity under the same wallet.
- No sub-wallet is needed for the upgrade tier.

### G1

Status: DONE.

Date: 2026-07-06

Ruling:

- Direct x402 / A2MCP pay-per-call is PROVEN and remains the primary rail for M2.
- Evidence: `ops/evidence/2026-07-04-forge-paid-path.md` shows the deployed fail-closed payment integration; `ops/evidence/2026-07-04-first-heartbeat.md` shows the real 1 USDT First Heartbeat settled end-to-end.
- Settlement tx: `0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b` on `eip155:196`.
- Fallback rails are not needed for the submission path. A2A escrow remains COULD-tier and must not displace x402 work before M2.
- T3.2 must still add double-entry accounting and retroactively verify the heartbeat split. G1 proves the rail, not the full revenue ledger.

## Spending Recalibration 2026-07-13

- User correction: payment integration is already DONE with a real 1 USDT x402 First Heartbeat.
- Therefore H2 no longer funds T3.1, R3 buyer-side testing, or proof that x402 works. Those are already proven by `ops/evidence/2026-07-04-first-heartbeat.md`.
- Project-funded calls are now evidence acquisition, not infrastructure validation. Preferred path: real customers pay their own 1 USDT calls.
- If AgentForge must subsidize proof calls, default cap is 2 USDT total: 1 USDT for a Launch Kit heartbeat and 1 USDT for one retry or seed customer call.
- The previous 5 USDT minimum and 10 USDT recommendation are retired unless the user explicitly approves a larger traction budget.
- OKB/gas should be funded only when actually needed for X Layer anchoring or if the funding interface requires a tiny OKB balance. Registration/listing actions remain free per R1 facts.
- 2026-07-13 update: H2 is now DONE for the recalibrated proof-call/anchor budget after the USDT-to-OKB gas conversion and ForgeAnchor deployment.

## ForgeAnchor Deployment 2026-07-13

- H2 was completed by converting `0.01` USDT to `0.000124197817697228` OKB on X Layer.
- ForgeAnchor was deployed on X Layer at `0xfd43a18b2c09903922fa452f6813e7577c48569d`.
- Deploy tx: `0xe79cbdc5500fe61cfde993b19882d7d9cd2b70b0271ac10ec3eaff3e6ca7ab3f`.
- Contract owner is the AgentForge X Layer wallet: `0xfc9b58e81BcE27c2f46558D501228D935f93e802`.
- Temporary deployer dust sweep failed; `0.00004299499964975` OKB is treated as unrecoverable because the one-time deployer key was not persisted.
- T4.1 is DONE. T4.2 should anchor the first birth certificate against this deployed contract.

## ShieldCheck Birth Certificate 2026-07-13

- T4.2 certificate of record: `bc_shieldcheck_2026-07-13`.
- Anchor tx: `0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a`.
- Anchor ID: `0x5bab8d702877c0aee90587003fbab09dd14faf62808a4c1336fee28d71e289f1`.
- Public verifier route: `/verify/bc_shieldcheck_2026-07-13`.
- Claim boundary: proves ShieldCheck was born from a real paid AgentForge forge call; it does not prove ShieldCheck's own paid heartbeat.
- The superseded tx `0x045091f9630e7a8df933c48d19ccefb5ff20e12caa1c43f7d996fd546c4f1b47` is not the certificate of record because it used an incomplete AgentSpec snapshot hash.

## T3.2 Ledger Policy 2026-07-13

- Currency: USDT, stored in atomic 6-decimal units from x402 settlement amounts.
- AgentForge-owned services use a 10000/0 split: 100% Forge revenue, 0% founder payable.
- Founder tenant services use the default 2000/8000 split: 20% Forge revenue, 80% founder payable.
- Splits are accounting records only. No payout, custody transfer, wallet action, or settlement movement is performed by T3.2.
- Every successful paid call must write one delivered `ServiceCall` row and one balanced ledger transaction before returning the deliverable.
- 2026-07-14 hardening update: anonymous unpaid quote requests no longer write durable quoted `ServiceCall` rows before returning the x402 payment challenge. Quote counts may remain in bounded runtime meters, but the durable ledger prioritizes settled economic events to avoid unauthenticated write amplification.
- First Heartbeat backfill is accounted as an AgentForge-owned `/svc/forge` call because the tx paid the business-builder service that generated ShieldCheck. It is not ShieldCheck's own heartbeat.
- Journal persistence path is `AGENTFORGE_LEDGER_PATH` or `/data/agentforge/service-ledger.jsonl`. The runtime dashboard summary merges the committed First Heartbeat seed journal with the live JSONL journal so paid call #2 appears from the runtime journal instead of a hand-copied web snapshot.
- Production still requires a Railway volume mounted at `/data` before the next paid call. As of the AUDIT-4 fix pass, `railway volume list --json` returned no volumes, so volume creation is a user-approval step rather than an implicit code edit.

## Runtime Public Surface 2026-07-13

- Public:
  - `GET /health`
  - `GET /ledger/summary`
  - `GET /svc`
  - `GET /svc/:tenant`
  - `POST /svc/:tenant`
  - `GET /mcp/:tenant`
- Token-protected internal:
  - `POST /internal/interview-draft`
  - `POST /internal/forge-gate/:tenant`
  - `POST /internal/forge-gate-live/:tenant`
- Token-protected QA branch:
  - `POST /svc/:tenant` with `Authorization: Bearer <AGENTFORGE_QA_TOKEN>` and
    `x-agentforge-qa: forge-gate-live` executes zero-priced Forge Gate probes only. It does not
    verify, settle, or record x402 payment revenue.
- Closed by default:
  - unknown routes return 404,
  - unknown tenants return 404,
  - unsupported service methods return 405.

## Retroactive Architecture Deviations 2026-07-13

Filed after AUDIT-2 because these choices were implemented before being declared.

- Launch Kit and ShieldCheck currently use rule-based deliverable builders, not a request→compiled AgentSpec→model router. Reason: the first production need was reliable review/checklist delivery with strict boundaries. Impact: these tenants should not be presented as fully model-personalized agents until the compiled-prompt router lands.
- `compileAgentSpec` output is not yet the runtime source for every tenant. Reason: the runtime catalog came first to satisfy public service routing and x402 isolation. Impact: future Forge Gate and tenant graduation must close this gap before citing compiled behavior as production evidence.
- Tenant status is stored in a static catalog rather than a state-machine-backed data store. Reason: low tenant count and urgent storefront/runtime deployment. Impact: state transitions must remain conservative and reviewed in code until persistent state lands.
- Service usage metering was originally in-memory. T3.2 replaces accounting-critical use with JSONL `ServiceCall` and ledger records; the old meters remain only as process-local operational counters.

### G2

Status: RULED — fallback active, recruitment continues as upside.

Date: 2026-07-13 (gate day)

Ruling (user decision, recorded by Auditor):

- The gate condition (≥3 real external founders live and earning by Jul 13) is NOT met: external founders = 0. Founder #1 (ShieldCheck) is the user; Launch Kit is self-operated.
- Per the gate's pre-written fallback: S5 leftovers (T5.1 templates, T5.2 referral) and COULD-tier work (T6.5 A2A escrow, T4.3 receipt batch-anchoring) are FROZEN. All remaining effort goes to the M2 path: AUDIT-1 closure → T4.1/T4.2 minimal provenance → demo → submission.
- The demo and all public/judge-facing copy are built on what is real TODAY — founder #1 + Launch Kit, honestly labeled ("forged and operated by AgentForge" where self-operated), with counts stated truthfully per I1 and positioning per S8 (enumerate evidence, never argue priority).
- The user is actively recruiting founders #2+ (H4). Any founder who completes the real ladder (interview → real Forge Gate → own paid heartbeat) before Jul 15 UPGRADES the demo/narrative but nothing depends on it. Recruitment failure changes nothing about M2 readiness.
- Founder heartbeats are founder-paid by default; project subsidy stays under the 2 USDT cap from the 2026-07-13 spending recalibration.

### T5 Resume Decision

Date: 2026-07-14

- User rejected jumping to T7.1 while Launch Kit proof, T5, H4/G2, and T6 remained unresolved.
- User directed: follow the correct order.
- Execution decision: resume T5 in order after completing Launch Kit's remaining paid proof.
- T5.1 is allowed to complete as a product-building task because it is in the executable plan and does not fabricate founder traction.
- T5.2 remains separate because referral credits must balance in the ledger; no referral copy may ship without ledger-backed accounting.

### T5.2 Referral Accounting Policy

Date: 2026-07-14

- Referral codes are allowlisted; unknown codes fail before payment verification or settlement.
- Current codes:
  - `agentforge-guild` → `agentforge-growth-pool`;
  - `shieldcheck-founder` → `founder-abiola-apata`.
- Referral credit rate is `1000` bps of Forge share, not gross settlement.
- Ledger treatment: credit gross Forge share, then debit Forge revenue for the referral credit and credit `liability:referral:<beneficiaryId>`.
- Dashboard Forge revenue is net of referral debits. Referral payable is shown separately.
- No payout is implied by the referral liability; payout execution remains a future human-controlled finance action.

### T5.3 Cross-Test Review Gate

Date: 2026-07-14

- Reviews are not inferred from paid receipts.
- A paid proof-of-service receipt makes a call eligible to be reviewed, but review count remains zero until review text is recorded.
- A publishable cross-test review must reference:
  - a `proof_of_service_receipt`;
  - `evidence.kind == paid_non_qa_service_call`;
  - matching `serviceCallId`;
  - matching target tenant/agent.
- Birth certificates, free QA probes, screenshots, or mismatched service-call IDs cannot back reviews.
- The `/cross-test` page may show eligible paid receipts, but must clearly state that no verified cross-test reviews exist until the review ledger contains real review text.

### T5.4 X Launch Engine Policy

Date: 2026-07-14

- The launch engine prepares drafts only; it does not publish to X.
- Founder/operator must manually edit and post from their own account.
- Drafts must be generated from real evidence records and include proof links.
- Drafts must stay inside current status:
  - AgentForge can say it is listed/public;
  - ShieldCheck and Launch Kit must remain soft-launch;
  - Launch Kit must remain self-operated, not an external customer win.
- No launch draft may claim independent reviews while `/cross-test` review count is zero.
- H6/T7.3 remains human-only.

### AUDIT-5 Fix Policy

Date: 2026-07-14

- Tenant catalog status is no longer treated as a plain display string. Catalog reads validate the current status against launch-ladder evidence in code.
- Launch Kit is corrected to `heartbeat`: it has live Forge Gate PASS evidence and a real paid self-operated heartbeat, but no birth-certificate/soft-launch transition proof yet.
- Launch Kit should not be exposed as a callable x402 route again until the next proof rung is recorded.
- Web template/gallery/catalog data stays self-contained for Vercel's app-only build context, but core cross-workspace tests must fail if it drifts from the core registry/status evidence.
- AgentForge #3746 pricing is frozen through M2. Do not change listing/runtime/storefront prices again before submission unless the user explicitly reopens pricing and accepts the review-risk tradeoff.

## Post-Listing Reality 2026-07-06

- AgentForge #3746 is LISTED after OKX review, visible/searchable in the marketplace, and eligible for recommendation.
- M1 is DONE. Evidence chain:
  - `a8caa11` registered AgentForge #3746 on-chain and submitted it for review.
  - `c54fd86` recorded the delisting root cause after OKX rejected the first service reality mismatch.
  - `f27cf10` updated #3746, removed the unreachable A2A service, added the proven A2MCP service, ran comm-readiness, and resubmitted.
  - OKX approval email on 2026-07-06 confirmed the relisted service passed review.
- T3.1 is DONE. The real 1 USDT First Heartbeat delivered a paid call end-to-end through `/svc/forge`.
- The repository was made private on 2026-07-06 because the listing is now public and copycat risk is high.
- Planned re-public date: 2026-07-15, aligned with M2 submission, after scrub check and evidence bundle prep.

## Listing Protection Rules

- Do not edit the live AgentForge #3746 listing before judging unless fixing something materially wrong.
- Any risky listing-change pattern must be tested on a secondary ASP identity first.
- Manage live listing settings only through the Agent conversation interface noted in the approval flow.
- Run comm-readiness after every create, update, or activation. This is now an ops rule, not manual memory.
- Do not list A2A services unless an always-on responder is running and verified.
- Public copy must sell outcomes, not mechanics: approved listing history, real paid heartbeat, proof receipts, founder pipeline, and launch infrastructure.

## Platform Facts 2026-07-06

Source: OKX Discord/FAQ facts captured in `ops/master-plan-v2.md` Section 0.

1. Review queue is backlogged; waitlisted competitors may face days of latency.
2. One wallet can create multiple ASPs, so spawned-agent identities can be submitted early after Forge Gate.
3. ASPs cannot be deleted; bad listings must be discarded/replaced rather than removed.
4. Approval behavior is inconsistent; do not make a judging deliverable depend on predictable review timing.
5. X Cup / Build X Series may be an additional visibility surface, but eligibility check must not distort scope.
6. Builders are visibly stuck on registration, review, and deletion issues; Launch Kit demand is real and should be productized without exposing factory internals.

## T0.2 Scaffold Decisions

Date: 2026-07-02

- Web deployment host: Vercel.
- Web production alias: https://web-one-peach-2vp0hv3dr1.vercel.app
- Web deployment ID: `dpl_5GLzHLAkvy8Bi8yaqHJzKEGAmuQP`
- Requested alias `agentforge.vercel.app`: unavailable. Vercel returned "The chosen alias \"agentforge.vercel.app\" is already in use"; `curl -I https://agentforge.vercel.app` returns HTTP 200 for an existing deployment.
- Requested alias `agentforge-ai.vercel.app`: unavailable. Vercel returned "The chosen alias \"agentforge-ai.vercel.app\" is already in use."
- Assigned alias `agentforgehq.vercel.app`: Vercel accepted the alias, but `curl -I https://agentforgehq.vercel.app` currently returns HTTP 302 to Vercel SSO. Public unauthenticated access still needs deployment protection disabled for that alias/project.
- Runtime local port: `4010`
- Runtime local health response verified: `{"ok":true,"service":"agentforge-runtime","status":"t0.2-shell"}`
- Runtime public deployment host: Railway.
- Runtime public URL: https://agentforge-runtime-production-9a4d.up.railway.app
- Runtime public deployment ID: `00b4b7a9-ed13-4b93-8bf0-7bd73ce70406`
- Runtime public service ID: `552ebd86-3201-4ea8-baab-791b42d92bc9`
- Runtime public host requirement: `HOST=0.0.0.0`; Railway injects `PORT=8080`. Local default remains `127.0.0.1`.
- `@okxweb3/mpp` install result: verified install succeeds through npm, but the package currently pulls critical advisories through `mppx`/`viem`. It was removed from active dependencies after verification and must not be wired into real payments until T3.1 confirms a safe SDK version or uses the raw HTTP 402 flow.
- Current dependency audit: 2 moderate advisories remain in Next's bundled PostCSS path. `npm audit fix --force` proposes a breaking downgrade and was not applied.

ASSUMPTION: Runtime should remain on a persistent host as required by the Buildbook, not Vercel serverless, because later MCP runtime work may require a long-lived process.

## Updated Security / Interface Requirements

Date: 2026-07-02

- Synced updated `Codex-Operating-Instructions-AGENTS.md` into repo root as `AGENTS.md`.
- Updated Buildbook adds invariant I9 Security and I10 Craft.
- T0.2 cannot pass final audit until the scaffold also includes:
  - shadcn/ui installed;
  - design tokens and palette recorded;
  - secret-scan hook/CI active;
  - dependency verification logged;
  - public runtime HTTPS deployment.
- Current web shell is only a functional scaffold and must be upgraded to the A8 design bar before any UI task is marked DONE under the updated Buildbook.

## T0.2 Design System

Date: 2026-07-03

- UI system: Tailwind CSS with shadcn/ui-style local components.
- shadcn config: `components.json`.
- Component aliases: `@/components`, `@/components/ui`, `@/lib/utils`.
- Installed runtime dependencies after npm name verification:
  - `class-variance-authority@0.7.1`
  - `clsx@2.1.1`
  - `tailwind-merge@3.6.0`
  - `lucide-react@1.23.0`
- Palette, updated by approved 2026-07-03 deviation to match the official blue robot mark:
  - background near-black navy `#020910`
  - surface navy `#07111f`
  - raised surface `#0b1728`
  - foreground silver `#f0f4f8`
  - muted text `#a6b4c4`
  - border `#1d3148`
  - primary blue `#3b82f6`
  - primary strong `#2563eb`
  - accent glow blue `#8cc8ff`
- Admin route policy: `/admin` returns 404 until authenticated operations are implemented; no public admin surface is exposed in T0.2.

## T0.2 Secret Scanning

Date: 2026-07-03

- Added GitHub Actions workflow `.github/workflows/secret-scan.yml`.
- Scanner: `gitleaks/gitleaks-action@v2`.
- Runs on pull requests and pushes to `main`.
- Added GitHub Actions workflow `.github/workflows/build-and-audit.yml`.
- Audit gate: `npm audit --audit-level=high`.
- Build gate: `npm run build`.
- No secrets or wallet private keys are stored in the repo.

## T0.2 Runtime Deployment Prep

Date: 2026-07-03

- Added runtime `Dockerfile` at `apps/runtime/Dockerfile`.
- Added `railway.toml` with Dockerfile builder and `/health` health check.
- Runtime public env requirement is `HOST=0.0.0.0` and `PORT` from host env.
- Railway auth completed on 2026-07-03 as `cyberrockng@gmail.com`.
- Railway project `agentforge-runtime` created and linked.
- Runtime service deployed successfully at https://agentforge-runtime-production-9a4d.up.railway.app.
- Evidence: `ops/evidence/2026-07-03-railway-runtime-public.md`.

## Listing Price Decision

Date: 2026-07-04

- First A2MCP service approval-review fee is `1` USDT.
- Earlier `15` USDT draft was a premium placeholder, not a platform requirement.
- The lower launch fee reduces H2 funding pressure while still proving a real paid-call path.
- Pricing can be updated later after approval and live payment proof.

## Cost-Controlled Launch Pricing

Date: 2026-07-14

- User first chose cost-controlled launch pricing instead of higher margin pricing, then superseded it the same day with API-safe pricing.
- Current service-call prices:
  - Forge: `0.40` USDT.
  - ShieldCheck: `0.40` USDT while still gated/non-public-callable.
  - Launch Kit: `0.45` USDT.
- These prices still assume bounded inputs/outputs, one paid request per result, no free retries except system failure, and per-call API cost tracking; the increase gives more room for model/API cost and edge-case retries.
- Follow-up: after user confirmation on 2026-07-14, the OKX.AI listing service fee for AgentForge `#3746` / `AI Agent Business Builder` was first updated from `1` USDT to `0.15` USDT, then superseded by the API-safe price of `0.40` USDT. Evidence: `ops/evidence/2026-07-14-okx-listing-price-update.md`, `ops/evidence/2026-07-14-api-safe-pricing-update.md`.
- Future price changes still require coordinated runtime, web, docs, and OKX.AI listing updates so the marketplace price and x402 quote do not diverge.

## T0.2 x402 Stub

Date: 2026-07-03

- Verified package metadata before install:
  - `@okxweb3/x402-express@0.1.1`, author `okfe`, maintainers include OKG email addresses.
  - `@okxweb3/x402-core@0.1.0`, author `okfe`, maintainers include OKG email addresses.
  - `@okxweb3/x402-mcp` is not published to npm as of this check.
- Installed `@okxweb3/x402-express@0.1.1` and `@okxweb3/x402-core@0.1.0` into `@agentforge/runtime`.
- `npm install` reported 0 vulnerabilities after install.
- Runtime route `POST /svc/:serviceId` now returns HTTP 402 with payment requirements when no payment header is provided.
- Runtime route `POST /svc/:serviceId` returns HTTP 501 with message `payment verification lands in T3.1` if a payment header is present.
- There is no fake payment-success path.
- Public `POST /svc/forge` verified on Railway: unpaid path returns HTTP 402; payment-header path returns HTTP 501.

## T3.1 x402 Paid Path

Date: 2026-07-04

- Added `@okxweb3/x402-evm@0.2.1` after install/audit verification.
- Replaced the old 402/501 stub for `POST /svc/forge` with OKX x402 core verification and settlement wiring.
- Payment scheme: `exact`.
- Network: `eip155:196` / X Layer.
- Recipient: project wallet `0xfc9b58e81bce27c2f46558d501228d935f93e802`.
- Launch price at implementation time: `$1.00` / 1 USDT. Current launch pricing was recalibrated on 2026-07-14 under `Cost-Controlled Launch Pricing`.
- Runtime accepts the SDK-documented `PAYMENT-SIGNATURE` header and the earlier `X-PAYMENT` alias.
- Verified payment path runs the real Founder Interview engine, builds an AI Agent Business Builder deliverable, settles through x402, and returns receipt data.
- Fail-closed rule: if OKX x402 facilitator credentials are absent or settlement fails, no deliverable is released.
- Required Railway variables for real paid acceptance:
  - `OKX_X402_API_KEY` or `OKX_API_KEY`
  - `OKX_X402_SECRET_KEY` or `OKX_SECRET_KEY`
  - `OKX_X402_PASSPHRASE` or `OKX_PASSPHRASE`
- Public deployment `e1067070-1669-421c-a3bd-c4515082a056` verified GET/service-info, unpaid 402, and invalid-payment fail-closed behavior.
- Evidence: `ops/evidence/2026-07-04-forge-paid-path.md`.

## Pre-Relist Runtime Contract

Date: 2026-07-04

- `/svc/forge` validates the request body before any x402 verification or settlement attempt.
- Invalid body requests return HTTP 400 with per-field guidance and explicitly state that payment was not verified, settled, or consumed.
- `GET /svc/forge` is the public contract endpoint and returns full input schema, types, required fields, field guidance, and an example request body.
- Runtime keep-alive is explicit with `keepAliveTimeout=65000` and `headersTimeout=66000`.
- Public deployment `5df89026-b0f7-4fe7-9541-058b553648f0` verified all three pre-relist blockers.
- Evidence: `ops/evidence/2026-07-04-pre-relist-blockers.md`.

## T1.2 Model Client Boundary

Date: 2026-07-03

- Founder Interview engine is being built behind a `ModelClient` interface.
- Added `createAnthropicModelClient`, which calls Anthropic Messages API through the existing `ModelClient` interface.
- Anthropic client requires `ANTHROPIC_API_KEY`; it does not fall back to a visible fake response when the key is missing.
- Default model is `claude-fable-5`, overridable with `ANTHROPIC_MODEL`.
- Runtime route `POST /internal/interview-draft` calls the live Anthropic client through `createAgentSpecDraft`.
- Internal route requires `Authorization: Bearer <AGENTFORGE_INTERNAL_TOKEN>`; the token is stored only in Railway variables.
- First live call exposed a real model-output issue: Anthropic returned fenced JSON. Client now extracts fenced JSON before schema validation.
- `test-stub` clients are allowed only in unit tests and non-production contexts.
- Production boot guard:
  - core helper `assertProductionModelClient` rejects `test-stub` when env is `production`;
  - runtime also refuses to boot when `NODE_ENV=production` and `MODEL_CLIENT=test-stub`.
- Live interview generation verified on Railway deployment `1f2d4fa9-cdfa-4347-b1a4-036cf6d757d0`.
- Evidence: `ops/evidence/2026-07-03-live-anthropic-interview.md`.
- No test stub is exposed through deployed user-visible surfaces.

## H1 Evidence

Date: 2026-07-03

- Status: DONE.
- Agentic Wallet created and CLI authenticated.
- Project wallet: OKX Agentic Wallet, TEE-signed, email-bound to the project account.
- EVM / X Layer address: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
- Solana address: `4Xkf5vZbfwftTLcCWtJ7dkRiqZJ5Ten3tYJp5zLMP5p1` (unused for AgentForge).
- Account ID: `1e1cd1f9-cf1b-4027-a30b-3c2ae270002f`
- Initial balance: `$0.00`
- Funding target for H2, recalibrated 2026-07-13: no funding is needed for T3.1/R3 payment proof. If subsidizing future proof calls, send only the smallest needed USDT amount on **X Layer** to `0xfc9b58e81bce27c2f46558d501228d935f93e802`; default cap is 2 USDT unless the user approves more. Add tiny OKB only if anchoring or the funding interface requires gas.

Security notes:

- The user separately created a browser-side wallet with a different address and a seed phrase. That wallet is not the project wallet and must not be referenced in AgentForge docs, listings, or code.
- `onchainos` CLI session is logged in on this machine. Codex must not re-login, touch wallet auth, or call `wallet add`.
- Codex must not run any `onchainos` command. Registration is reserved for Claude with the user present.

Tooling now available:

- `onchainos` CLI v4.0.1 at `~/.local/bin/onchainos`.
- Official OKX skills installed under `~/.claude/skills/okx-*` v4.0.1.
- Relevant skills: `okx-agent-identity`, `okx-agentic-wallet`, `okx-agent-payments-protocol`, `okx-agent-task`.

## Registration Session Facts

Date: 2026-07-03

- Marketplace legal consent accepted for wallet `0xfc9b58e81bce27c2f46558d501228d935f93e802`.
- Standing consent covers platform transactions.
- OKX is not a party to transactions.
- Escrow is an ownerless contract.
- Disputes go to the provider, which is AgentForge.
- AgentForge brand avatar on OKX CDN: https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/74ffa21c-6cc3-4430-96fe-d3d3c0e5035a.png
- Identity registration is in progress with Claude and user through the wallet session.
- First manually truthful service: A2A `Custom AI Agent Development`.
- First A2MCP service is added only after Codex delivers the public x402 endpoint.

## R1 Registration Facts

Date: 2026-07-03

Sources: OKX.AI Become-ASP browser flow and `okx-agent-identity` skill v4.0.1.

### Identity Model

- ASP identity is an ERC-8004 on-chain identity on X Layer.
- Registration flow:
  1. pre-check / consent gate;
  2. field collection;
  3. `validate-listing` QA in a single batch pass;
  4. confirmation;
  5. `create`;
  6. `activate` to publish.
- Marketplace review target is within 24 hours, with result emailed to the Agentic Wallet email.
- Unreviewed or failed-review services are still callable by Agent ID; only marketplace visibility is gated.
- Rejected listings can be fixed through the update flow.
- Create, update, activate, and deactivate are free; OKX covers registration network fees.
- H2 funding is not needed for registration, T3.1, or R3 anymore. H2 is only for optional subsidized future proof calls and X Layer anchor contract gas.

### ASP Identity Fields

- Name: English brand name, 3-25 characters, no test markers, no celebrity names.
- Description: one-sentence summary, 500 characters or fewer.
- Avatar: required image file, PNG/JPEG/WebP, 1:1 recommended, 1 MB or smaller. CLI upload returns CDN URL.

### Per-Service Fields

- One ASP identity can hold multiple services through an add-another loop.
- Service name: 5-30 characters, descriptive noun phrase, not equal to agent name, no price in name.
- Service description: strict two-part structure:
  - Part 1: core capability, what it does, and who it is for, 200 characters or fewer.
  - Part 2: what the user must provide, with numbered inputs, 200 characters or fewer.
- Forbidden in service description: example prompts, GitHub links, wallet links, tech-stack details, and disclaimers.
- Type: `A2MCP` for API/pay-per-call or `A2A` for negotiated escrow.
- Fee: plain number string, USDT only, up to 6 decimals. A2MCP requires a fee; A2A fee is optional.
- Endpoint: required for A2MCP only; must be `https://`, public, reachable, deployed, 512 characters or fewer.
- Endpoint restrictions: no localhost, no private IPs, no mock or placeholder URLs.
- Endpoint is permanent on-chain. Changing it later requires an update transaction.
- A2MCP endpoint must support the x402 payment standard to go live.

### Registration Constraints / Corrections

- Fee currency is USDT, not USDG. Use USDT in listing copy, ledger defaults, and dashboard labels.
- A2MCP service endpoint must be live and x402-capable before service registration.
- Register AgentForge ASP identity as soon as brand avatar exists; add the first A2MCP service once the public runtime endpoint is ready.
- M1 means identity registered, first service listed, and activated by July 6, 2026.
- Listing copy constraints here override earlier draft copy. Avoid tech-stack terms such as Groth16, MCP runtime, or contract details in service descriptions.

## G0 Ruling

Date: 2026-07-03

Empirical result:

- `canCreate:true`
- `aspCount:0`
- `uniqueness:"multiple"`

Ruling:

- Adopt one AgentForge ASP identity for the base product.
- Spawned agents onboard first as services under AgentForge.
- Mature spawned agents can graduate to their own ASP identity under the same wallet.
- This confirms the hybrid ladder at both service and identity levels.
- The launch ladder, ledger, and provenance architecture remain unchanged.

## Developer Surface Facts

Date: 2026-07-02

### ASP Modes

- OKX.AI ASPs can expose services through A2MCP or A2A.
- A2MCP is the correct primary mode for AgentForge because it fits standardized callable services: "take parameters, return a clear result."
- A2A is useful for negotiated/custom work and remains COULD-tier only.
- Registration facts:
  - A2MCP registration needs service name, description, price per call, and endpoint.
  - A2A registration needs name, description, service list, and default pricing.
  - Marketplace review is stated as completed within 2 business days and result is sent to the Agentic Wallet email.

Source references:

- ASP overview: https://web3.okx.com/onchainos/dev-docs/okxai/asp
- A2MCP guide: https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp
- ASP registration: https://web3.okx.com/onchainos/dev-docs/okxai/registerasp

### MCP / Endpoint Requirements

- AgentForge needs a programmatically callable API first; MCP wraps that API into tools an AI can call.
- A2MCP requires a public server reachable worldwide over HTTPS.
- OKX docs explicitly say the MCP public address is the entry point other users call.
- The endpoint submitted to OKX.AI must be the public address of the existing MCP/API.
- Localhost is not acceptable for listing or real A2MCP invocation.
- MCP Inspector is the recommended debugging tool to verify an AI can call the service.

Implementation consequence:

- `apps/runtime` must be deployed to a persistent public HTTPS host before R1/M1 can be truthfully completed.
- Vercel is acceptable for `apps/web`; runtime still needs Railway/Fly/VPS or equivalent persistent host access.

### Payment Surface

- For sellers of DApp/MCP services, OKX describes a middleware approach: unpaid requests receive HTTP 402 and do not reach business logic.
- The Broker handles on-chain interactions for sellers; seller integration needs a receiving address rather than running a node.
- Node SDK docs list current x402 package families:
  - `@okxweb3/x402-core`
  - `@okxweb3/x402-evm`
  - `@okxweb3/x402-express`
  - `@okxweb3/x402-next`
  - `@okxweb3/x402-hono`
  - `@okxweb3/x402-fastify`
  - `@okxweb3/x402-fetch`
  - `@okxweb3/x402-axios`
  - `@okxweb3/x402-mcp`
  - `@okxweb3/x402-paywall`
- Buyer-side flow: receive HTTP 402, parse payment requirements, sign payment payload with configured EVM scheme, retry request with the `PAYMENT` header.
- Receipt surface: after the resent request succeeds, the server returns a `PAYMENT-RESPONSE` header containing the payment receipt; docs mention tx hash / settled amount.
- X Layer network identifier in examples: `eip155:196`.

Source references:

- Payment overview: https://web3.okx.com/onchainos/dev-docs/payments/overview
- Seller quickstart: https://web3.okx.com/onchainos/dev-docs/payments/service-seller
- Node SDK reference: https://web3.okx.com/onchainos/dev-docs/payments/sdk-nodejs

### SDK Risk / Package Choice

- `@okxweb3/mpp` install was verified during T0.2, but npm audit reported critical advisories through `mppx` and `viem`; it is not retained as an active dependency.
- R2 recommendation: build payment integration in T3.1 against the newer x402 packages first, especially `@okxweb3/x402-express` for `apps/runtime` or `@okxweb3/x402-mcp` if its current package audit is clean.
- If x402 packages also fail audit or integration, use the documented raw HTTP 402 protocol rather than keeping a vulnerable payment SDK.

### Spawned Agent Wallet Identity

Status: UNKNOWN from public docs.

- Docs confirm ASP registration and Agentic Wallet login at the provider account level.
- Docs do not clearly confirm that each spawned sub-agent can hold its own OKX marketplace wallet identity.
- Current implementation stance remains the hybrid ladder from G0:
  - Every spawned agent launches instantly as a tenant/sub-service under AgentForge.
  - Founder/AgentForge splits are recorded in AgentForge's double-entry ledger.
  - Mature agents may get individual OKX.AI listings later if R1/G0 confirms the platform supports it.

### OKX GitHub Surface

- `okx/agent-skills` provides plug-and-play skill markdown files for OKX operations and uses `@okx_ai/okx-trade-cli`.
- `okx/agent-trade-kit` provides `okx-trade-mcp` and `okx-trade-cli`; it is a local MCP server/CLI for exchange account operations, not the core runtime we need for AgentForge.
- AgentForge should not depend on trading-account tooling for the MVP unless a later task explicitly needs OKX market/trading functions.

Source references:

- https://github.com/okx/agent-skills
- https://github.com/okx/agent-trade-kit

### Required Credentials / Human Inputs

- OKX.AI account and Agentic Wallet email/login for H1.
- Optional operations-wallet funding with USDT and X Layer gas for recalibrated H2.
- Receiving EVM address for seller payment settlement.
- Runtime persistent host access/token: Railway login/token, Fly token, VPS SSH, or equivalent.
- `ANTHROPIC_API_KEY` for T1.2/T1.4/T2.1 runtime model calls.
- `FORGE_WALLET_KEY` for X Layer anchoring/test payment flows; keep scoped and never use for custody.
- `XLAYER_RPC_URL` for provenance anchors.
- Optional OKX CLI/API credentials only if later tasks use `agent-skills` or `agent-trade-kit`; not required for AgentForge MVP runtime.
