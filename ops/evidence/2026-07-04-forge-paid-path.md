# T3.1 Evidence — `/svc/forge` paid path wiring

Date: 2026-07-04  
Runtime: https://agentforge-runtime-production-9a4d.up.railway.app  
Deployment: `e1067070-1669-421c-a3bd-c4515082a056`

## Implementation

- Added `@okxweb3/x402-evm@0.2.1`.
- Wired `POST /svc/forge` through OKX x402 core HTTP processing with `ExactEvmScheme` on `eip155:196`.
- Runtime accepts `PAYMENT-SIGNATURE` and legacy `X-PAYMENT` as payment header inputs.
- Payment configuration:
  - scheme: `exact`
  - network: `eip155:196`
  - payTo: `0xfc9b58e81bce27c2f46558d501228d935f93e802`
  - price: `$1.00`
  - service: `AI Agent Business Builder`
- Verified-payment path runs the live Founder Interview / Anthropic draft engine, builds a business-builder deliverable, settles through x402, and returns deliverable + receipt.
- No fake success path exists. If x402 facilitator credentials are missing, payment-header requests return `503 payment_facilitator_not_configured`.

## Public endpoint checks

`GET /svc/forge` returned HTTP 200:

```http
HTTP/2 200
content-type: application/json

{"service":"AI Agent Business Builder","route":"/svc/forge","method":"POST","price":"1 USDT","network":"eip155:196","payment":"x402 exact","requiredInput":["founderName","expertiseArea","targetCustomer","servicesOffered","boundaries","tone","pricingPreference","brandName optional"]}
```

Unpaid `POST /svc/forge` returned HTTP 402:

```http
HTTP/2 402
content-type: application/json

{"x402Version":2,"error":"PAYMENT-SIGNATURE header is required","accepts":[{"scheme":"exact","network":"eip155:196","amount":"1000000","maxAmountRequired":"1000000","resource":"/svc/forge","description":"AI Agent Business Builder","mimeType":"application/json","payTo":"0xfc9b58e81bce27c2f46558d501228d935f93e802","maxTimeoutSeconds":300,"asset":"USDT","price":"$1.00","outputSchema":{"type":"object","properties":{"status":{"type":"string"},"receipt":{"type":"object"}}},"extra":{"serviceId":"forge","currency":"USDT","displayAmount":"1 USDT","legacyHeaderAlias":"X-PAYMENT"}}]}
```

Invalid fake-payment `POST /svc/forge` returned HTTP 503:

```http
HTTP/2 503
content-type: application/json

{"error":"payment_facilitator_not_configured","message":"Missing OKX_X402_API_KEY or OKX_API_KEY"}
```

## Verification

- `npm run build --workspace @agentforge/runtime` passed.
- `npm run build` passed across all workspaces, including Next.js `--webpack`.
- `npm test` passed: 4 files, 20 tests.
- `npm audit --audit-level=high` exited 0.
- Remaining npm advisories are the known moderate Next/PostCSS advisory; the proposed fix remains a breaking downgrade.

## Remaining acceptance blocker

The code path is deployed, but T3.1 cannot be marked DONE until a real external 1-USDT call succeeds. Railway still needs OKX x402 facilitator variables:

- `OKX_X402_API_KEY` or `OKX_API_KEY`
- `OKX_X402_SECRET_KEY` or `OKX_SECRET_KEY`
- `OKX_X402_PASSPHRASE` or `OKX_PASSPHRASE`

2026-07-13 update: superseded by `ops/evidence/2026-07-04-first-heartbeat.md`. T3.1/R3 are now DONE with a real 1 USDT x402 proof, so H2 is no longer required for payment-integration validation.
