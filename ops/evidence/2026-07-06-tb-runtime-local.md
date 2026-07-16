# T-B Evidence — multi-tenant runtime local verification
Date: 2026-07-06

## Scope verified locally

- Added tenant registry with two isolated tenants:
  - `forge` — public `AI Agent Business Builder`, `/svc/forge`, `/mcp/forge`, 1 USDT.
  - `launch-kit` — gated `OKX.AI Launch Kit`, `/svc/launch-kit`, `/mcp/launch-kit`, 1 USDT.
- Added per-tenant metadata: persona, service, pricing, knowledge facts, refusal boundaries, input schema, MCP manifest route, and in-memory meter.
- Added per-tenant x402 route generation. Payment route keys are:
  - `POST /svc/forge`
  - `POST /svc/launch-kit`
- Added runtime tests for:
  - two tenant configs with no knowledge cross-talk;
  - defensive copies from the registry;
  - independent per-tenant meter increments;
  - x402 route generation per tenant;
  - Launch Kit output staying scoped to launch readiness;
  - service listing containing exactly `forge` and `launch-kit`.

## Commands

- `npm run build` — PASS.
- `npm test` — PASS, including runtime tests: 1 runtime test file, 6 runtime tests.
- `npm run typecheck` — PASS.
- `npx eslint .` — PASS.

## Local endpoint checks

Runtime command:

```sh
PORT=4021 HOST=127.0.0.1 node apps/runtime/dist/server.js
```

Read endpoints verified with `curl`:

- `GET /svc` returned both tenants with separate schemas, persona, knowledge facts, price, MCP route, and meter.
- `GET /svc/forge` returned only the AgentForge business-builder schema and AgentForge knowledge facts.
- `GET /svc/launch-kit` returned only the Launch Kit schema and Launch Kit knowledge facts.
- `GET /mcp/launch-kit` returned the Launch Kit MCP-style manifest with `/svc/launch-kit`, 1 USDT, `eip155:196`, and x402 exact payment metadata.

## Local unpaid POST behavior

With no real OKX facilitator env, `POST /svc/forge` and `POST /svc/launch-kit` fail closed before delivery:

```json
{
  "error": "payment_facilitator_not_configured",
  "message": "Failed to initialize: no supported payment kinds loaded from any facilitator."
}
```

This local-only result is expected because dummy credentials cannot fetch supported payment kinds. Live 402 quote verification must run on Railway after deploy, where the real x402 facilitator env is configured.

## Railway live verification

Deployment:

- Railway service: `agentforge-runtime`.
- Public URL: `https://agentforge-runtime-production-9a4d.up.railway.app`.
- Deployment ID after T-B deploy: `3af8f5e1-5011-4bcf-84e9-dd50a2727a8e`.

Live checks:

- `GET /health` returned `ok:true`.
- `GET /svc` returned both tenants:
  - `forge`, status `public`, route `/svc/forge`, MCP route `/mcp/forge`, price `1 USDT`.
  - `launch-kit`, status `gated`, route `/svc/launch-kit`, MCP route `/mcp/launch-kit`, price `1 USDT`.
- `GET /svc/launch-kit` returned only Launch Kit schema/persona/knowledge facts.
- `GET /mcp/launch-kit` returned the Launch Kit MCP-style manifest.
- Unpaid `POST /svc/forge` returned HTTP 402 with `payment-required` payload containing `tenantSlug:"forge"` and service ID `ai-agent-business-builder`.
- Unpaid `POST /svc/launch-kit` returned HTTP 402 with `payment-required` payload containing `tenantSlug:"launch-kit"` and service ID `okxai-launch-kit`.
- After those quote requests, live `GET /svc` showed independent meters:
  - `forge`: `quoted:1`, `paid:0`, `delivered:0`.
  - `launch-kit`: `quoted:1`, `paid:0`, `delivered:0`.

Acceptance status:

- Two tenants are live on Railway.
- Tenant schemas, persona, pricing, knowledge facts, and MCP manifests are separated.
- x402 quote payloads are tenant-scoped.
- Metering is per-tenant and shows zero cross-talk after one quote request to each tenant.
