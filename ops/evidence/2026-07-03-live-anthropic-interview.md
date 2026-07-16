# Live Anthropic Interview Verification

Date: 2026-07-03

## Deployment

- Runtime URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Railway deployment ID: `1f2d4fa9-cdfa-4347-b1a4-036cf6d757d0`
- Status: `SUCCESS`
- Internal endpoint: `POST /internal/interview-draft`
- Auth: `Authorization: Bearer <redacted AGENTFORGE_INTERNAL_TOKEN>`

## Endpoint Protection Check

Unauthenticated request:

```text
HTTP/2 401
cache-control: no-store
content-type: application/json

{"error":"unauthorized"}
```

## First Live Failure

The first authenticated Anthropic-backed request reached the model but returned fenced JSON:

```text
HTTP/2 400

{"error":"interview_draft_failed","message":"Unexpected token '`', \"```json\n{\n\"... is not valid JSON"}
```

Fix:

- Added fenced-JSON extraction in `packages/core/src/anthropic-client.ts`.
- Added regression coverage in `packages/core/src/anthropic-client.test.ts`.

## Successful Live Request

Authenticated request after the fix:

```text
HTTP/2 200
cache-control: no-store
content-type: application/json
```

Validated response summary:

```json
{
  "draft": {
    "agent_name": "AdaAudit AI",
    "category": "software",
    "services": [
      {
        "service_id": "launch_readiness_review",
        "title": "Launch Readiness Review",
        "price_usdt": 15
      },
      {
        "service_id": "positioning_feedback",
        "title": "Positioning Feedback",
        "price_usdt": 15
      }
    ],
    "boundaries": {
      "refusal_policy": [
        "Refuse to provide legal guarantees or legal advice of any kind.",
        "Refuse to request, accept, store, or handle private keys, seed phrases, or credentials.",
        "Refuse to fabricate traction, metrics, customers, endorsements, or any unverifiable claims."
      ]
    },
    "knowledge": {
      "facts": [
        "AdaAudit AI is based on founder Ada's expertise in software launch reviews.",
        "The target customer is early-stage software founders.",
        "Services offered are launch readiness reviews and positioning feedback, each priced at 15 USDT."
      ],
      "documents": []
    }
  }
}
```

## Invariant Notes

- Request used the real Railway `ANTHROPIC_API_KEY`; no local or repo-stored key was used.
- Internal endpoint requires a server-only token.
- Generated draft is not shown in public Guild/storefront surfaces.
- Draft keeps the no-fabricated-traction and no-private-key boundaries.
