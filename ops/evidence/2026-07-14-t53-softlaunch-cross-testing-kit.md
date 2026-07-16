# T5.3 Soft-launch cross-testing kit · 2026-07-14

Status: DONE.

## Acceptance

Buildbook acceptance:

- Soft-launch cross-testing kit.
- Reviews require real paid calls.

Delivered:

- Added public `/cross-test` page.
- Added `apps/web/src/lib/cross-testing.ts` as the review evidence gate.
- The kit lists paid proof-of-service receipts that are eligible to back a review:
  - `psr_forge_b8f8787c7c13`;
  - `psr_shieldcheck_642e7372000a`;
  - `psr_launch-kit_3b103d9976a5`.
- Review count remains `0` because no actual cross-test review text has been recorded yet.
- Added validation that blocks review records unless:
  - the referenced record is a `proof_of_service_receipt`;
  - the receipt evidence kind is `paid_non_qa_service_call`;
  - the review `serviceCallId` matches the receipt's `serviceCallId`;
  - the review target tenant matches the paid receipt's agent.
- Birth certificates, screenshots, QA probes, and mismatched ServiceCall IDs cannot back reviews.
- Linked `/cross-test` from `/`, `/forge`, and `/templates`.

## Public page content

The page shows:

- cross-test workflow;
- required review fields;
- paid-call evidence eligible to back a review;
- verified cross-test review ledger;
- explicit `0 verified cross-test reviews recorded` state.

This is intentional: paid receipts are eligible evidence, not reviews by themselves.

## Files

- `apps/web/src/lib/cross-testing.ts`
- `apps/web/src/lib/cross-testing.test.ts`
- `apps/web/src/app/cross-test/page.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/forge/page.tsx`
- `apps/web/src/app/templates/page.tsx`

## Validation

Local validation:

- `npm test` — PASS.
  - core: 8 files, 42 tests.
  - payments: 2 files, 24 tests.
  - provenance: 1 file, 8 tests.
  - runtime: 3 files, 18 tests.
  - web: 5 files, 24 tests.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.

Vercel production deployment:

- deployment id: `dpl_FiYCGMQzRBaTqs6FvMNsAD2jh79n`;
- deployment URL: `https://web-ct0c9yma7-cyberrockng-s-projects.vercel.app`;
- stable alias: `https://web-one-peach-2vp0hv3dr1.vercel.app`;
- state: READY.

Live verification:

- `GET /cross-test` returned HTTP `200`.
- `/cross-test` contains:
  - `T5.3 Soft-launch cross-testing kit`;
  - `0 verified cross-test reviews recorded`;
  - `psr_shieldcheck_642e7372000a`;
  - `psr_launch-kit_3b103d9976a5`;
  - `ServiceCall ID`;
  - `Receipt eligible`.
- `/` links `/cross-test`.
- `/forge` links `/cross-test`.
- `/templates` links `/cross-test` and states reviews require paid-call receipts.

## Boundaries

- No wallet, payment, contract, OKX listing, OKX identity, Railway deploy, or `onchainos` command was run.
- No review was invented or counted.
- No paid cross-test call was initiated.
- T5.4 X Launch Engine was not started.

## Next

Proceed to T5.4 X Launch Engine. It should prepare founder-editable launch post drafts and must not publish to X or claim reviews that do not exist.
