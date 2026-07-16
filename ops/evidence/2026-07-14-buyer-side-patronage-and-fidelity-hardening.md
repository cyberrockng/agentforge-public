# Buyer-side patronage + AgentForge fidelity hardening · 2026-07-14

## Scope

User approved buyer-side patronage spend up to `1.1 USDT` from the separate
`Abiola(Buyer)` user identity. The first run used Foreman's `Launch Readiness
Pack` before continuing to the remaining providers.

## Buyer identity

- User identity: `Abiola(Buyer)`
- User agent id: `5632`
- Registration tx: `0x40532e182b910339d697c2a02e387e419096f9c71f5742a8c0e0c583ad631f2b`

## Foreman run

- Provider: Foreman `#4348`
- Live service id used: `33357`
- Seller-pasted service id `27669` was stale; live `service-list` showed `33357`.
- Service: `Launch Readiness Pack`
- Price: `0.5 USDT`
- Payment mode: `x402`
- Job id: `0xe12ff104bb8936036a0da0f7950c4d197b1327253dde502094fbe2e4fed8264d`
- Task creation tx: `0x5f7f729fd26ece7cb7d7f317f234b85e4c22252b9e11669876804af076591b9e`
- Payment tx: `0x1f53aa0d7e5dc9d26352ce7f564e0b9fbe63b2c5b5aca7a7425b9aa2802f8e08`
- Delivered file:
  `/home/dell/.onchainos/deliverables/user/0xe12ff104bb8936036a0da0f7950c4d197b1327253dde502094fbe2e4fed8264d_LaunchReadinessPack/LaunchReadinessPack_20260714_133441903.txt`

## Foreman result

The x402 path worked and produced a real deliverable, but the deliverable did
not use the AgentForge-specific buyer fields. It returned default/generic values:

- `projectName`: `OKX.AI agent launch`
- `summary`: `Agent service preparing for OKX.AI listing review.`
- `listingDraft`: empty
- `liveUrl`: empty
- `deadline`: empty

The automated OKX task flow submitted this rating at completion:

- Score: `2.50 / 5.00`
- Comment: `Valid x402 delivery, but output was generic and missed AgentForge details.`

Important process note: Codex did not manually run `feedback-submit`; the OKX
task automation did. This violated the intended human-review-before-rating
operating preference, so the remaining PolicyPool/GlassDesk patronage was paused.

## AgentForge fidelity hardening

The Foreman result identified a product-risk class for AgentForge:

> A paid agent can settle correctly but still earn a poor review if the output
> ignores buyer-specific fields and falls back to generic/default material.

AgentForge now adds an `inputFidelity` section to paid business-builder
deliverables and repairs generic model drafts from the original buyer input
before returning the paid result. The repaired fields include buyer-supplied
services, pricing preference, profile bio, and boundaries.

## Code changes

- `apps/runtime/src/business-builder.ts`
  - Adds `inputFidelity` to paid AgentForge deliverables.
  - Repairs generic model drafts using the original buyer input.
  - Preserves/repairs buyer-specific services, price preference, profile bio,
    and boundaries.

## Validation

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.

## Boundary

- No additional OKX patronage spend after the `0.5 USDT` Foreman run.
- No PolicyPool or GlassDesk task was started.
- No AgentForge paid `/svc/forge` x402 call was executed for this hardening pass.
- No listing, price, identity, anchor, Railway, or Vercel deployment action was run.
