import { describe, expect, it } from "vitest";
import { assertReviewBackedByPaidCall, getCrossTestingKit, type CrossTestReview } from "./cross-testing";

const validReview: CrossTestReview = {
  reviewId: "review_shieldcheck_01",
  reviewerName: "Independent buyer",
  targetSlug: "shieldcheck",
  receiptRecordId: "psr_shieldcheck_642e7372000a",
  serviceCallId: "sc_shieldcheck_642e7372000a",
  askedFor: "Review a suspicious airdrop claim.",
  cameBack: "A scam-risk verdict with red flags and safe next steps.",
  heldUp: "The output stayed inside wallet-safety boundaries and did not request secrets.",
  caveat: "Single paid heartbeat; not a broad safety guarantee.",
  publishedAt: "2026-07-14T12:00:00.000Z"
};

describe("soft-launch cross-testing kit", () => {
  it("lists paid service receipts as review-eligible evidence without counting them as reviews", () => {
    const kit = getCrossTestingKit();

    expect(kit.eligiblePaidCalls.map((call) => call.receiptRecordId)).toEqual([
      "psr_forge_b8f8787c7c13",
      "psr_shieldcheck_642e7372000a",
      "psr_launch-kit_3b103d9976a5"
    ]);
    expect(kit.eligiblePaidCalls.every((call) => call.reviewEligible)).toBe(true);
    expect(kit.reviews).toHaveLength(0);
    expect(kit.reviewRequirement).toContain("real paid proof-of-service receipt");
  });

  it("accepts a review only when the paid receipt and ServiceCall match", () => {
    expect(() => assertReviewBackedByPaidCall(validReview)).not.toThrow();
  });

  it("rejects a review backed only by a birth certificate", () => {
    expect(() =>
      assertReviewBackedByPaidCall({
        ...validReview,
        receiptRecordId: "bc_shieldcheck_2026-07-13"
      })
    ).toThrow("must reference a paid proof-of-service receipt");
  });

  it("rejects a review with a mismatched ServiceCall ID", () => {
    expect(() =>
      assertReviewBackedByPaidCall({
        ...validReview,
        serviceCallId: "sc_forge_b8f8787c7c13"
      })
    ).toThrow("serviceCallId does not match receipt");
  });

  it("rejects a review where the target tenant does not match the paid receipt", () => {
    expect(() =>
      assertReviewBackedByPaidCall({
        ...validReview,
        targetSlug: "launch-kit"
      })
    ).toThrow("target agent does not match receipt");
  });
});
