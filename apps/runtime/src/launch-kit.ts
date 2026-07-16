import { z } from "zod";
import type { TenantRuntimeConfig } from "./tenant-registry.js";

export const LaunchKitInputSchema = z.object({
  projectName: z.string().min(1),
  listingStatus: z.string().min(1),
  serviceDescription: z.string().min(1),
  endpointOrDeliveryPath: z.string().min(1),
  blockerOrFeedback: z.string().min(1).optional(),
  proofAssets: z.array(z.string().min(1)).optional()
});

export type LaunchKitInput = z.infer<typeof LaunchKitInputSchema>;

export const launchKitInputSchema = {
  type: "object",
  required: ["projectName", "listingStatus", "serviceDescription", "endpointOrDeliveryPath"],
  properties: {
    projectName: {
      type: "string",
      minLength: 1,
      guidance: "Name of the ASP, service, or project being prepared for review."
    },
    listingStatus: {
      type: "string",
      minLength: 1,
      guidance: "Current state such as draft, under review, delisted, rejected, or listed."
    },
    serviceDescription: {
      type: "string",
      minLength: 1,
      guidance: "The service copy or capability statement the reviewer will compare against reality."
    },
    endpointOrDeliveryPath: {
      type: "string",
      minLength: 1,
      guidance: "Public HTTPS endpoint for A2MCP or always-on responder path for A2A."
    },
    blockerOrFeedback: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "Reviewer feedback, failed validation text, or the exact launch blocker."
    },
    proofAssets: {
      type: "array",
      items: { type: "string" },
      optional: true,
      guidance: "Existing proof items such as listing ID, endpoint checks, paid-call txs, review messages, or demo links."
    }
  }
} as const;

export const launchKitExampleRequestBody = {
  projectName: "ReviewReady",
  listingStatus: "draft before OKX.AI submission",
  serviceDescription: "Reviews ASP listing copy and checks whether the delivery path matches the listed service.",
  endpointOrDeliveryPath: "https://example.com/svc/reviewready with x402 exact enabled",
  blockerOrFeedback: "Need to know whether the endpoint and service copy are ready for review.",
  proofAssets: ["Draft listing screenshot", "Clean-session endpoint curl", "Payment-required response"]
};

export type LaunchKitDeliverable = {
  title: string;
  projectName: string;
  listingStatus: string;
  verdict: "ready-with-caveats" | "not-ready";
  checks: Array<{
    name: string;
    status: "pass" | "fix";
    detail: string;
  }>;
  repairPlan: string[];
  delistingRecovery: string[];
  proofBundle: string[];
  aspRegistrationPackage: {
    agentName: string;
    category: string;
    shortDescription: string;
    serviceTitle: string;
    serviceDescription: string;
    endpointRequirement: string;
    suggestedFee: string;
    submitterChecklist: string[];
  };
  boundaries: string[];
};

export function buildLaunchKitDeliverable(
  tenant: TenantRuntimeConfig,
  input: LaunchKitInput
): LaunchKitDeliverable {
  const hasHttps = input.endpointOrDeliveryPath.includes("https://");
  const mentionsPayment = /x402|402|pay|payment|usdt/i.test(input.endpointOrDeliveryPath);
  const mentionsAlwaysOn = /always.?on|daemon|responder|a2a|reachable|message/i.test(input.endpointOrDeliveryPath);
  const hasFeedback = Boolean(input.blockerOrFeedback?.trim());
  const proofAssets = input.proofAssets ?? [];
  const hasProof = proofAssets.length > 0;
  const notReady = !hasHttps || (!mentionsPayment && !mentionsAlwaysOn);

  return {
    title: tenant.service.title,
    projectName: input.projectName,
    listingStatus: input.listingStatus,
    verdict: notReady ? "not-ready" : "ready-with-caveats",
    checks: [
      {
        name: "Service reality match",
        status: input.serviceDescription.length >= 80 ? "pass" : "fix",
        detail:
          input.serviceDescription.length >= 80
            ? "The service description is specific enough to compare against the real delivery path."
            : "Expand the description so a reviewer can tell exactly what the service does and what the buyer provides."
      },
      {
        name: "Public delivery path",
        status: hasHttps ? "pass" : "fix",
        detail: hasHttps
          ? "The delivery path includes a public HTTPS endpoint or equivalent reachable service."
          : "A2MCP services need a public HTTPS endpoint; localhost, private hosts, and placeholders are not review-ready."
      },
      {
        name: "Payment/readiness signal",
        status: mentionsPayment || mentionsAlwaysOn ? "pass" : "fix",
        detail:
          mentionsPayment || mentionsAlwaysOn
            ? "The delivery path includes a paid-call or always-on readiness mechanism that can be tested before review."
            : "Record how the reviewer can observe the paid or always-on service path before submission."
      },
      {
        name: "Feedback captured",
        status: hasFeedback ? "pass" : "fix",
        detail: hasFeedback
          ? "The blocker or reviewer feedback is captured and can drive a targeted fix."
          : "If there is prior feedback, include it verbatim so the repair plan addresses the actual finding."
      },
      {
        name: "Proof bundle started",
        status: hasProof ? "pass" : "fix",
        detail: hasProof
          ? `Proof assets already listed: ${proofAssets.slice(0, 5).join("; ")}.`
          : "Before submission, collect at least one endpoint/readiness proof and one status or payment reference."
      }
    ],
    repairPlan: [
      "Make the listed capability narrower than the actual service can deliver today.",
      "Verify the endpoint or responder from a clean session before review; do not rely on localhost or a logged-in browser.",
      "For A2MCP, capture a payment-required response and one successful paid call when funding is available.",
      "For A2A, run comm-readiness after every create, update, or activation and save the ready-state output.",
      "Archive the request, response, payment or readiness proof, review status, and repair narrative in the evidence bundle."
    ],
    delistingRecovery: [
      "Do not edit the approved/live listing first. Fix the underlying service path or responder before changing marketplace copy.",
      "Reduce claims to what a reviewer can personally observe in a clean session.",
      "Re-run endpoint/payment or comm-readiness checks after the fix.",
      "Prepare a short resubmission note: original failure, root cause, concrete fix, and proof reference.",
      "After relisting or update, run the readiness check again in the same session."
    ],
    proofBundle: [
      "Listing ID or draft screenshots",
      "Public endpoint contract or responder readiness check",
      "One successful real call or message transcript",
      "Payment or review-status reference where applicable",
      "Plain-language summary of what changed after any failed review",
      ...proofAssets.map((asset) => `Provided asset: ${asset}`)
    ],
    aspRegistrationPackage: {
      agentName: "OKX.AI Launch Kit",
      category: "business",
      shortDescription:
        "Review-ready launch checks for OKX.AI builders: listing copy, endpoint readiness, delisting recovery, and proof bundles.",
      serviceTitle: "Launch Readiness Review",
      serviceDescription:
        "Reviews an OKX.AI ASP launch package for listing clarity, endpoint or responder readiness, delisting risk, and proof gaps. Returns a pass/fix report, repair plan, and evidence checklist.",
      endpointRequirement:
        "Use /svc/launch-kit only after the Launch Kit tenant clears its soft-launch transition evidence; current proof is a paid heartbeat, not an open public-callable state.",
      suggestedFee: "0.45 USDT",
      submitterChecklist: [
        "Confirm the endpoint returns payment-required from a clean session after soft-launch transition evidence is recorded.",
        "Run and archive the required gate, heartbeat, birth-certificate, and receipt evidence before submitting the spawned ASP identity.",
        "Keep public copy outcome-focused and avoid internal AgentForge mechanics.",
        "Run comm-readiness after create/update if the listing includes any A2A service.",
        "Save listing ID, endpoint proof, and paid-call receipt in ops evidence."
      ]
    },
    boundaries: tenant.refusalBoundaries
  };
}
