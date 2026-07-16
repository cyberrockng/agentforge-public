# AgentForge x402 Buyer API

## Discovery

- List services: `GET /svc`
- Service info: `GET /svc/<slug>/info`
- MCP manifest: `GET /mcp/<slug>`
- Paid endpoint: `POST /svc/<slug>`
- Recovery: `GET|POST /svc/<slug>/recovery`

Callable tenants currently include public or softlaunch entries only. Heartbeat/gated tenants may be visible but are not callable for public paid traffic.

## 402 Challenge

Unauthenticated `GET /svc/<slug>` and `POST /svc/<slug>` return an x402 402 challenge for callable tenants.

AgentForge augments JSON 402 bodies with top-level `outputSchema`:

```json
{
  "purpose": "Buyer-agent guidance for shaping the POST replay body. OKX tooling does not auto-fill this; the buyer or agent must submit the JSON body explicitly.",
  "schema": {},
  "exampleRequestBody": {},
  "preflightEndpoint": "/svc/forge/preflight"
}
```

This is a documentation convention for buyer agents. OKX CLI/task tooling does not auto-construct replay bodies from it.

## Forge Preflight

For `/svc/forge`, buyers should first call:

```bash
curl -sS -X POST https://<runtime>/svc/forge/preflight \
  -H 'content-type: application/json' \
  --data '<founder-interview-json>'
```

Preflight validates the body without payment, persists a short-lived private quote, and returns `quote.paidEndpoint`. Use that URL for the fresh 402 challenge and replay. If a buggy task client replays `{}`, AgentForge can recover only the exact preflight-validated body bound to `af_quote`.

Required Forge body fields:

- `founderName`
- `expertiseArea`
- `targetCustomer`
- `servicesOffered`
- `boundaries`
- `tone`
- `pricingPreference`

Optional:

- `brandName`
- `referralCode`

## Paid Replay Rules

- Submit valid JSON explicitly with the paid `POST`.
- Do not include seed phrases, private keys, wallet passwords, OTPs, API secrets, or private customer data.
- If using `af_quote`, the request body must match the preflight body hash unless the body is empty and recovered from the quote.
- Mismatched, expired, malformed, or cross-tenant quotes are rejected before settlement.
- GET with payment can verify but will not settle; paid delivery requires POST.

## Paid Response

Successful paid responses include:

- `status: "delivered"`
- `receipt.transaction`, `receipt.network`, `receipt.amount`
- `ledger.serviceCallId`, `ledger.transactionId`, `ledger.persisted`
- `recovery.recoveryEndpoint`, `recovery.requestBodySha256`, `recovery.ledgerPersisted`, `recovery.archivePersisted`
- `deliverable`
- optional `bookkeepingWarning`

If settlement succeeds but ledger/archive persistence fails, AgentForge still returns the deliverable and receipt. Save the response and follow recovery/manual make-good instructions before completing or reviewing the task.

## Recovery

Use `POST /svc/<slug>/recovery` with either `paymentTransaction` or `serviceCallId`, plus `originalBody` or `requestBodySha256`.

Recovery never lists deliverables. It returns an archived response only when the paid reference and body proof match.

If recovery cannot return a settled paid response, follow `ops/customer-support-sla.md` for make-good delivery or refund handling.

## No-Payment Contract Verification

Operators can verify the deployed buyer path without spending funds:

```bash
npm run verify:runtime -- https://agentforge-runtime-production-9a4d.up.railway.app
```

The command checks health, readiness, security headers, unpaid Forge 402 `outputSchema`, valid preflight quote creation, and malformed-body rejection. It does not settle payment, but it does create a short-lived preflight quote.
