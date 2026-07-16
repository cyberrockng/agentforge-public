# AgentForge Customer Recovery And Refund SLA

## Scope

This policy applies to paid x402 AgentForge service calls where a buyer paid but did
not receive, lost, or cannot recover the expected deliverable.

## Buyer Promise

- If no x402 settlement occurred, AgentForge asks the buyer to retry from preflight
  with a fresh quote. No refund is owed because no paid settlement happened.
- If x402 settlement occurred and the buyer did not receive a usable deliverable,
  AgentForge will provide make-good delivery or agree a refund path.
- AgentForge does not ask for seed phrases, private keys, wallet passwords, OTPs, or
  secret platform credentials during support.

## Support Intake

Ask the buyer for:

- Payment transaction hash.
- AgentForge service route, such as `/svc/forge` or `/svc/shieldcheck`.
- Original JSON request body, or the response `requestBodySha256` if they saved it.
- OKX task/job id, if the payment came through an OKX task flow.
- Screenshot or copied error message, if available.

## Response Targets

- Acknowledge the issue within 12 hours.
- Confirm whether AgentForge sees the payment in its ledger or recovery archive
  within 24 hours.
- Deliver the make-good response or agree the refund path within 48 hours after the
  buyer provides the transaction hash and original body.

## Recovery Procedure

1. Ask the buyer to POST the payment transaction plus original JSON body to the
   route's recovery endpoint.
2. If recovery returns an archived deliverable, ask the buyer to inspect it before
   completing or reviewing the task.
3. If recovery reports the payment is not in the AgentForge ledger, verify the
   transaction externally and check runtime logs for the timestamp.
4. If settlement reached AgentForge but no deliverable was archived, rebuild the
   deliverable from the exact original body and send it directly as make-good
   delivery.
5. If the deliverable cannot be reconstructed or the buyer reasonably rejects the
   make-good response, agree a refund path.

## Operator Rules

- Do not disclose another customer's request body, deliverable, vulnerability, or
  private audit notes.
- Do not claim a refund is complete until a transaction hash or platform-confirmed
  refund record exists.
- Add a regression test or runbook update for every paid-support incident before
  marking it closed.
