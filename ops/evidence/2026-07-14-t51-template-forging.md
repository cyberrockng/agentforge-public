# T5.1 Template Forging · 2026-07-14

Status: DONE.

## Acceptance

Buildbook acceptance:

- Five templates.
- Includes one Launch Kit-derived template.
- Founder personalization required.

Delivered:

- Added executable template forging engine in `packages/core/src/templates.ts`.
- Added five templates:
  - `launch-readiness-review` — Launch Kit-derived.
  - `phishing-scam-review` — ShieldCheck-derived.
  - `listing-copy-clinic` — AgentForge blueprint.
  - `evidence-pack-builder` — AgentForge blueprint.
  - `support-triage-agent` — AgentForge blueprint.
- Added `createTemplateAgentSpecDraft(input)`, which turns a selected template plus founder personalization into a valid `AgentSpecDraft`.
- Founder personalization fields required by schema:
  - founder name;
  - brand name optional;
  - target customer;
  - expertise area;
  - service focus;
  - founder boundaries;
  - tone;
  - pricing preference.
- Added public `/templates` page showing only template metadata and the boundary that templates are drafts, not listed agents, receipts, reviews, external-founder wins, or approval claims.
- Linked `/templates` from `/` and `/forge`.

## Files

- `packages/core/src/templates.ts`
- `packages/core/src/templates.test.ts`
- `packages/core/src/index.ts`
- `apps/web/src/lib/templates.ts`
- `apps/web/src/lib/templates.test.ts`
- `apps/web/src/app/templates/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/forge/page.tsx`

## Validation

Local validation:

- `npm test` — PASS.
  - core: 8 files, 42 tests.
  - payments: 2 files, 20 tests.
  - provenance: 1 file, 8 tests.
  - runtime: 3 files, 17 tests.
  - web: 4 files, 18 tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.

Vercel production deployment:

- First deployment attempt failed:
  - deployment id: `dpl_BkC1EbHYJ2217dF9FFNjyrhYoLdo`
  - reason: web project root is `apps/web`; a `file:../../packages/core` dependency was not available in the remote build upload.
- Fix:
  - kept the executable template engine in `packages/core`;
  - removed the cross-root web dependency;
  - rendered the public template gallery from web-local metadata.
- Final production deployment:
  - deployment id: `dpl_FTooja5GLt2tkBJtvr9NZsLA2Hpk`
  - deployment URL: `https://web-ootc5w200-cyberrockng-s-projects.vercel.app`
  - stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`
  - state: READY.

Live verification:

- `GET https://web-one-peach-2vp0hv3dr1.vercel.app/templates` returned HTTP `200`.
- `/templates` contains:
  - `T5.1 Template Forging`;
  - `Five service templates ready for founder personalization`;
  - `launch-readiness-review`;
  - `Launch Kit-derived`;
  - `phishing-scam-review`;
  - `Template output is a draft only`.
- `GET /` returned HTTP `200` and links `/templates`.
- `GET /forge` returned HTTP `200` and links `/templates`.

## Boundaries

- No wallet, payment, contract, listing, OKX identity, Railway runtime deploy, or `onchainos` command was run.
- No template is counted as a founder, customer, receipt, review, or public agent.
- T5.2 referral credits were not started.
- T5.3 soft-launch cross-testing kit was not started.
- T5.4 X Launch Engine was not started.

## Next

Proceed to T5.2 Referral loop. Acceptance risk: referral credits must balance in the ledger, so the next implementation must extend the double-entry journal rather than adding marketing-only referral copy.
