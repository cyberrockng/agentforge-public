# AgentForge Listing Fields Draft

Date: 2026-07-03

Status: Draft for user and auditor review. Public x402 endpoint is ready; final human review still required before submission.

## ASP Identity

Name:

```text
AgentForge
```

Description:

```text
AgentForge turns expert knowledge into paid AI services with verified outputs, receipts, and founder earnings tracking.
```

Avatar:

```text
https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/74ffa21c-6cc3-4430-96fe-d3d3c0e5035a.png
```

## Service 1

Service name:

```text
AI Agent Business Builder
```

Type:

```text
A2MCP
```

Fee:

```text
1
```

Fee currency:

```text
USDT
```

Service description part 1:

```text
Turns expert knowledge into a ready AI service business profile, service menu, pricing plan, and launch copy for OKX.AI founders.
```

Service description part 2:

```text
Provide: 1. expertise area, 2. target customer, 3. services offered, 4. pricing preference, 5. brand name if available.
```

Endpoint:

```text
https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge
```

## Constraint Check

- Identity name: 10 characters, valid.
- Identity description: one sentence, under 500 characters.
- Service name: 25 characters, valid descriptive noun phrase, no price.
- Service description: two-part structure, each part under 200 characters.
- No example prompts, links, wallet addresses, tech-stack terms, or disclaimers in service description.
- Fee is a plain number string in USDT. Final approval-review price is `1 USDT` to support low-cost real paid-call proof.
- Endpoint is public HTTPS and returns HTTP 402 payment requirements when called without payment.
