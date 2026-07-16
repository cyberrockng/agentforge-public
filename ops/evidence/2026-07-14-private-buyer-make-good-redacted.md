# Private Buyer Make-Good - Redacted Public Record

Date: 2026-07-14

## What Happened

A real buyer used AgentForge's Business Builder through the OKX x402 task flow. The payment settled,
but the platform replay did not leave a readable deliverable artifact for the buyer.

AgentForge provided a direct make-good package to the buyer and used the incident to harden the
product path:

- `/svc/<tenant>/recovery`
- buyer-visible recovery handles
- private delivery archive writes after settlement
- quote-bound preflight URLs for parameterized replay recovery
- stricter "inspect before complete/review" buyer guidance

## Privacy Boundary

The buyer's brand, request body, generated deliverable, endpoint details, and any customer-specific
security material are intentionally omitted from this public repo record.

A private local copy of the original make-good artifact is retained outside the repository at:

`/home/dell/agentforge-private/evidence/2026-07-14-private-buyer-business-builder-make-good-deliverable.json`

Do not commit that private file, publish it on proof surfaces, include it in judge/demo materials, or
share it without buyer approval.

## Public Claim Allowed

AgentForge may say:

- A paid x402 replay/recovery failure class was found through real buyer usage.
- AgentForge provided a make-good path.
- The product was hardened with preflight, quote binding, recovery, and post-settlement archive
  behavior.

AgentForge must not say:

- The buyer's name.
- The buyer's private request or generated deliverable.
- Customer-specific vulnerability findings or payload details.
- That this make-good created a marketplace review, rating, or completed task.
