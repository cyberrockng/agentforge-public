# Pre-Relist Blocker Evidence — `/svc/forge`

Date: 2026-07-04  
Runtime: https://agentforge-runtime-production-9a4d.up.railway.app  
Deployment: `5df89026-b0f7-4fe7-9541-058b553648f0`

## Blocker 1 — Validate body before payment verification

Status: PASS.

`POST /svc/forge` now reads and validates the request body before x402 verification. Invalid body requests return HTTP 400 and state that payment was not verified, settled, or consumed.

Public check with invalid body and `X-PAYMENT: fake`:

```http
HTTP/2 400
content-type: application/json

{"error":"invalid_request_body","message":"Fix the request body before paying. Payment was not verified, settled, or consumed.","fields":{"founderName":{"expected":"string","guidance":"Name of the founder or operator requesting the business-builder deliverable."},"expertiseArea":{"expected":"string","guidance":"The real expertise, workflow, or service area the AI agent should package.","issue":"Required"},"targetCustomer":{"expected":"string","guidance":"The specific buyer segment the generated agent should serve.","issue":"Required"},"servicesOffered":{"expected":"non-empty array of strings","guidance":"A non-empty list of services or outcomes the founder can truthfully deliver.","issue":"Required"},"boundaries":{"expected":"non-empty array of strings","guidance":"A non-empty list of things the generated agent must refuse or avoid.","issue":"Required"},"tone":{"expected":"string","guidance":"The communication style for the generated agent.","issue":"Required"},"pricingPreference":{"expected":"string","guidance":"The founder's intended pricing direction or launch-price constraint.","issue":"Required"},"brandName":{"expected":"optional string","guidance":"Optional brand name to use instead of deriving one."}}}
```

## Blocker 2 — GET returns full input schema and example

Status: PASS.

`GET /svc/forge` returns HTTP 200 with:

- service name
- route
- method
- price
- network
- payment type
- full input schema with types, required fields, and field guidance
- example request body

Schema fields:

- `founderName`: string, required
- `expertiseArea`: string, required
- `targetCustomer`: string, required
- `servicesOffered`: non-empty string array, required
- `boundaries`: non-empty string array, required
- `tone`: string, required
- `pricingPreference`: string, required
- `brandName`: string, optional

## Blocker 3 — Keep-alive active

Status: PASS.

Runtime explicitly sets:

- `server.keepAliveTimeout = 65000`
- `server.headersTimeout = 66000`

Public HTTP/1.1 health check returned:

```http
HTTP/1.1 200 OK
Connection: keep-alive

{"ok":true,"service":"agentforge-runtime","status":"t0.2-shell","keepAlive":{"enabled":true,"timeoutMs":65000,"headersTimeoutMs":66000}}
```

## Regression Check

Valid-but-unpaid `POST /svc/forge` still returns HTTP 402, proving validation did not bypass the payment gate:

```http
HTTP/2 402
payment-required: <base64 x402 payment requirement>

{}
```

## Verification

- `npm run build` passed across all workspaces.
- `npm test` passed: 4 files, 20 tests.
- `npm audit --audit-level=high` exited 0.
- Remaining npm advisories are the known moderate Next/PostCSS advisory; the proposed fix remains a breaking downgrade.
