# OKX Listing Price Update

Date: 2026-07-14

## Scope

User approved aligning the OKX.AI marketplace service fee with the live runtime/web cost-controlled pricing.

Changed listing:

- Agent: AgentForge `#3746`
- Service: `AI Agent Business Builder`
- Existing service ID: `19485`
- Endpoint: `https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge`
- Previous OKX listing fee: `1 USDT`
- New OKX listing fee: `0.15 USDT`

## Pre-update state

The OKX listing was active and listed:

- Agent ID: `#3746`
- Name: `AgentForge`
- Role: ASP
- Status: active
- Approval status: listed / eligible for task recommendations
- Existing service fee: `1 USDT`

Runtime and web had already been deployed with:

- Runtime `/svc/forge`: `0.15 USDT`
- Web storefront Forge price: `0.15 USDT`

## Safety and execution

- Listing validation passed with no findings before update.
- Local A2A readiness initially blocked the update; the local A2A environment was repaired and rechecked.
- OKX accepted the listing update.
- Returned update transaction: `0x0001ffd734e9ae7b13160cbdb058f9f60bce0032ec667a33a57993c5d99c60e1`
- Post-update A2A communication refresh/setup completed successfully.

## Boundaries

- No customer payment call was run.
- No wallet transfer or service subsidy was initiated.
- No ShieldCheck listing/public-callable status was changed.
- This update only aligned AgentForge's existing OKX.AI service fee with the deployed runtime price.

## Superseded follow-up

The `0.15 USDT` fee was superseded later on 2026-07-14 by the API-safe price of `0.40 USDT`.

Evidence: `ops/evidence/2026-07-14-api-safe-pricing-update.md`.
