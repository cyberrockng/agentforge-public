# AgentForge Security Architecture And Threat Model

## Assets

- Buyer payments and x402 settlement receipts.
- Buyer request bodies and paid deliverables.
- Tenant catalog, launch-ladder status, proof references, and public claims.
- Ledger journal, delivery archive, payment quotes, and referral accounting.
- Anthropic, OKX x402, wallet, Railway, and deployment secrets.
- Founder consent/evidence records and private operational notes.

## Trust Boundaries

- Public HTTP boundary: `/svc/*`, `/svc/*/preflight`, `/svc/*/recovery`, `/mcp/*`, `/health`, `/ready`.
- Payment boundary: OKX x402 verification and settlement.
- Model boundary: Anthropic output is untrusted until schema and quality checks pass.
- Persistence boundary: Postgres ledger database when `AGENTFORGE_STORAGE_MODE=postgres`; otherwise Railway volume files for JSONL ledger, quotes, archives, and evidence.
- Tenant boundary: tenant route, body schema, catalog status, and proof data.
- Internal boundary: bearer-protected `/internal/*` Forge Gate and draft endpoints.

## Actors

- Legitimate buyer agents using x402.
- Malformed or buggy buyer agents that replay `{}` or stale quote URLs.
- Abusive clients attempting rate-limit bypass, payload floods, or repeated probes.
- Prompt-injection buyers trying to override tenant boundaries or extract secrets.
- Operators deploying with missing secrets or broken writable volumes.
- Third-party service outages: Anthropic, OKX facilitator, Railway volume.

## Controls

- Server-side body validation before payment settlement.
- Quote-bound preflight (`af_quote`) recovers validated bodies from buggy empty replays.
- x402 settlement occurs only after deliverable generation succeeds.
- New invariant: after settlement succeeds, bookkeeping failure returns a delivered response with warnings instead of a buyer 400.
- Ledger integrity checks reject delivered duplicate payment refs and unbalanced transactions.
- Postgres ledger mode creates durable uniqueness constraints on journal keys, service call IDs, ledger transaction IDs, and payment references.
- Postgres ledger appends run inside a transaction with an advisory lock so competing runtime processes serialize integrity checks and inserts.
- Atomic journal file locking serializes appends across runtime processes that share the same persistent volume when JSONL mode is selected.
- Production readiness requires an explicit `AGENTFORGE_STORAGE_MODE` declaration so Postgres, single-instance JSONL, or shared-volume JSONL assumptions are visible before traffic.
- Production readiness requires an explicit `AGENTFORGE_SETTLEMENT_ADDRESS`; local/test fallback is not accepted in production.
- Delivery recovery requires paid reference plus original body hash/body before exposing archived deliverables.
- Rate limiter does not trust raw spoofed XFF by default, prunes buckets, and caps memory.
- Production boot/readiness checks fail missing critical secrets, missing `DATABASE_URL` in Postgres mode, unreachable ledger database, or unwritable JSONL persistence paths.
- Security headers applied to JSON and x402 responses.
- Internal routes require bearer tokens and Forge Gate routes reject answer-key metadata.

## Abuse Cases And Expected Behavior

- Malformed body: reject before x402 verification or settlement.
- Empty replay with valid `af_quote`: recover validated body before settlement.
- Empty replay without quote: reject before settlement.
- Duplicate settlement/payment ref: return deliverable after settlement; ledger warning if persistence rejects duplicate.
- Ledger volume failure after settlement: return deliverable, receipt, and `ledgerPersisted: false`.
- Archive failure after settlement: return deliverable and `archivePersisted: false`; recovery may require manual make-good.
- Model timeout/outage: fail closed before settlement; retry bounded transient failures.
- Rate-limit spoofing: spoofed XFF does not mint unlimited buckets unless explicitly configured as trusted.
- Prompt injection: tenant deliverables and Forge Gate checks treat buyer text as untrusted input.

## Residual Risks

- File-backed JSONL ledger mode is not a distributed transactional database across separate volumes or ephemeral containers; use Postgres mode for multi-replica runtime writes.
- Recovery archive durability depends on the mounted Railway volume.
- Listener-level tests now assert unpaid 402 and mocked paid settlement through a bound HTTP server; a real paid production smoke still requires explicit human approval because it spends funds.
- `outputSchema` is a buyer-agent convention, not an OKX protocol guarantee.
