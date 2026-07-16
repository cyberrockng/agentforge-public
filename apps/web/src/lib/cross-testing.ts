import { findStorefrontTenant } from "./tenant-catalog";
import { verificationRecords, type VerificationRecord } from "./verify-records";

export type CrossTestReview = {
  reviewId: string;
  reviewerName: string;
  targetSlug: string;
  receiptRecordId: string;
  serviceCallId: string;
  askedFor: string;
  cameBack: string;
  heldUp: string;
  caveat: string;
  publishedAt: string;
};

export type CrossTestEligibleCall = {
  slug: string;
  agentName: string;
  serviceTitle: string;
  receiptRecordId: string;
  serviceCallId: string;
  paymentTx: string;
  amount: string;
  verifierHref: string;
  caveat: string;
  reviewEligible: boolean;
};

export type CrossTestingKit = {
  title: string;
  reviewRequirement: string;
  steps: string[];
  requiredReviewFields: string[];
  eligiblePaidCalls: CrossTestEligibleCall[];
  reviews: CrossTestReview[];
  blockedReviewCount: number;
};

const reviews: CrossTestReview[] = [];

export function getCrossTestingKit(): CrossTestingKit {
  return {
    title: "Soft-launch cross-testing kit",
    reviewRequirement:
      "A review is publishable only when it references a real paid proof-of-service receipt and matching ServiceCall ID.",
    steps: [
      "Choose a soft-launch or public service from the AgentForge storefront.",
      "Create a buyer-style request with a narrow, testable outcome.",
      "Pay the live x402 service call; free QA probes and screenshots do not count.",
      "Save the receipt record, ServiceCall ID, payment transaction, and verifier link.",
      "Write the review from the actual request and deliverable: what was asked, what came back, whether it held up, and any caveats."
    ],
    requiredReviewFields: [
      "Reviewer name or handle",
      "Target agent/service",
      "Receipt record ID",
      "ServiceCall ID",
      "What the reviewer asked for",
      "What came back",
      "Whether the output held up",
      "Caveat or rough edge"
    ],
    eligiblePaidCalls: paidServiceReceipts().map(toEligibleCall),
    reviews: reviews.map(cloneReview),
    blockedReviewCount: 0
  };
}

export function assertReviewBackedByPaidCall(review: CrossTestReview) {
  const receipt = findPaidServiceReceipt(review.receiptRecordId);

  if (!receipt) {
    throw new Error(`Review ${review.reviewId} must reference a paid proof-of-service receipt.`);
  }

  if (receipt.evidence.serviceCallId !== review.serviceCallId) {
    throw new Error(`Review ${review.reviewId} serviceCallId does not match receipt.`);
  }

  const tenant = findStorefrontTenant(review.targetSlug);

  if (!tenant) {
    throw new Error(`Review ${review.reviewId} targets an unknown tenant.`);
  }

  if (tenant.agentId !== receipt.agentId) {
    throw new Error(`Review ${review.reviewId} target agent does not match receipt.`);
  }
}

function paidServiceReceipts() {
  return verificationRecords.filter(
    (record) =>
      record.recordType === "proof_of_service_receipt" &&
      record.evidence.kind === "paid_non_qa_service_call"
  );
}

function findPaidServiceReceipt(recordId: string) {
  return paidServiceReceipts().find((record) => record.recordId === recordId) ?? null;
}

function toEligibleCall(record: VerificationRecord): CrossTestEligibleCall {
  const slug = slugForServicePath(record.evidence.servicePath);
  const tenant = findStorefrontTenant(slug);

  return {
    slug,
    agentName: record.agentName,
    serviceTitle: tenant?.service.title ?? record.title,
    receiptRecordId: record.recordId,
    serviceCallId: record.evidence.serviceCallId,
    paymentTx: record.evidence.paymentTx,
    amount: record.evidence.amount,
    verifierHref: `/verify/${record.recordId}`,
    caveat: record.caveat,
    reviewEligible: Boolean(tenant)
  };
}

function slugForServicePath(servicePath: string) {
  return servicePath.replace(/^\/svc\//, "");
}

function cloneReview(review: CrossTestReview): CrossTestReview {
  return { ...review };
}
