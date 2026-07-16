import type { AgentSpecDraft, FounderInterviewInput } from "@agentforge/core";

export type BusinessBuilderDeliverable = {
  title: string;
  founder: string;
  brandName: string;
  positioning: {
    customer: string;
    promise: string;
    category: string;
  };
  serviceMenu: Array<{
    serviceId: string;
    title: string;
    description: string;
    priceUsdt: number;
    buyerInputs: string[];
    outputFormat: string;
  }>;
  requestedServiceCoverage: Array<{
    requested: string;
    coveredIn: string[];
    note: string;
  }>;
  buyerIntake: {
    required: string[];
    optionalProofAssets: string[];
    doNotSend: string[];
    privacyNote: string;
  };
  launchCopy: {
    profileBio: string;
    marketplaceDescription: string;
    firstPost: string;
  };
  operatingRules: {
    refusalPolicy: string[];
    outOfScope: string[];
  };
  pricingPlan: {
    launchPriceUsdt: number;
    source: string;
    rationale: string;
    stepUpRule: string;
    reviewTrigger: string;
  };
  proofGuidance: {
    firstProofCall: string;
    receiptChecklist: string[];
    evidenceBoundary: string;
    privacyRule: string;
  };
  qualityReport: {
    passed: boolean;
    launchReadinessVerdict: "ready_for_founder_review" | "blocked_until_repaired";
    reviewPolicy: string;
    checks: Array<{
      id: string;
      label: string;
      passed: boolean;
      detail: string;
    }>;
    blockingFailures: string[];
  };
  operationalAccuracy: {
    passed: boolean;
    domain: ServiceDomain;
    requirement: string;
    moneyModel: Array<{
      label: string;
      amountUsdt: number | null;
      source: string;
      constraint: string;
    }>;
    rulesChecked: Array<{
      id: string;
      passed: boolean;
      detail: string;
    }>;
    forbiddenClaimDrift: string[];
    warnings: string[];
  };
  inputFidelity: {
    passed: boolean;
    matchedFields: string[];
    missingFields: string[];
    repairedFields: string[];
    warnings: string[];
  };
  nextActions: string[];
};

export class BusinessBuilderQualityError extends Error {
  constructor(readonly failures: string[]) {
    super(`Business Builder deliverable failed blocking quality checks: ${failures.join("; ")}`);
    this.name = "BusinessBuilderQualityError";
  }
}

export function buildBusinessBuilderDeliverable(
  input: FounderInterviewInput,
  draft: AgentSpecDraft
): BusinessBuilderDeliverable {
  const brandName = input.brandName ?? draft.agent_name;
  const preferredPriceUsdt = parsePriceUsdt(input.pricingPreference);
  const draftFidelity = evaluateDraftFidelity(input, draft, preferredPriceUsdt);
  const domainProfile = classifyServiceDomain(input);
  const buyerIntake = buildBuyerIntake(input, domainProfile);
  const serviceMenu = buildServiceMenu(
    input,
    draft,
    brandName,
    preferredPriceUsdt,
    draftFidelity,
    buyerIntake,
    domainProfile
  );
  const firstService = serviceMenu[0];
  const servicePromise =
    buildDomainPromise(input, brandName, domainProfile, firstService?.description) ??
    `${brandName} packages ${input.expertiseArea} into a focused paid AI service for ${input.targetCustomer}.`;
  const profileBio = buildDomainProfileBio(input, brandName, domainProfile, draft.persona.bio);
  const refusalPolicy = unique(
    draft.boundaries.refusal_policy.concat(input.boundaries).concat(domainSpecificRefusalPolicy(domainProfile.domain))
  );
  const outOfScope = unique(draft.boundaries.out_of_scope.concat(domainSpecificOutOfScope(domainProfile.domain)));
  const launchPriceUsdt = preferredPriceUsdt ?? firstService?.priceUsdt ?? 0;
  const requestedServiceCoverage = buildRequestedServiceCoverage(input, domainProfile);
  const launchCopy = {
    profileBio,
    marketplaceDescription: buildMarketplaceDescription(input, brandName, domainProfile),
    firstPost: buildFirstPost(input, brandName, domainProfile)
  };
  const repairedFields = [
    ...draftFidelity.repairedFields,
    ...(profileBio === draft.persona.bio ? [] : ["profileBio"]),
    ...input.boundaries.filter((boundary) => !containsSignal(draft.boundaries.refusal_policy.join(" "), boundary))
      .map((boundary) => `boundary:${boundary}`)
  ];
  const missingFields = evaluateDeliverableMissingFields(input, {
    founder: input.founderName,
    brandName,
    customer: input.targetCustomer,
    servicePromise,
    serviceMenu,
    requestedServiceCoverage,
    launchCopy,
    profileBio,
    refusalPolicy
  });
  const positioning = {
    customer: input.targetCustomer,
    promise: servicePromise,
    category: domainPositioningCategory(domainProfile.domain, draft.category)
  };
  const operatingRules = {
    refusalPolicy,
    outOfScope
  };
  const pricingPlan = {
    launchPriceUsdt,
    source: preferredPriceUsdt !== null ? "founder_pricing_preference" : "model_service_price",
    rationale:
      domainProfile.domain === "coverage-accountability"
        ? `Free eligibility preflight remains 0 USDT. The paid covenant receipt fee starts from the founder's stated pricing preference: ${input.pricingPreference}. Coverage caps are separate from the service fee and remain bounded by target job value, published policy, and available reserve.`
        : preferredPriceUsdt !== null
        ? `Starts from the founder's stated pricing preference: ${input.pricingPreference}.`
        : "Uses the first generated service price because the founder did not provide a numeric launch price.",
    stepUpRule:
      domainProfile.domain === "coverage-accountability"
        ? "Keep preflight free. Change the paid receipt fee only after real accepted-job usage proves buyers understand the cap, reserve, deadline, and breach rules."
        : "Hold the launch price until at least 2-3 real paid calls prove buyers understand and value the output, then raise only with evidence.",
    reviewTrigger:
      domainProfile.domain === "coverage-accountability"
        ? "Revisit pricing after each declined preflight, disputed receipt, reserve-cap complaint, low rating, or repeated buyer confusion about fee versus coverage cap."
        : "Revisit pricing after each paid proof call, refund complaint, low rating, or repeated buyer question about value."
  };
  const proofGuidance = {
    firstProofCall:
      "Run one controlled paid buyer-style call before broad promotion; inspect whether the output uses the founder's real fields.",
    receiptChecklist: [
      "paid transaction hash",
      "serviceCallId / ledger transaction id",
      "inputFidelity result",
      "buyer-visible deliverable summary",
      "explicit caveats and unproven claims",
      "operationalAccuracy result"
    ],
    evidenceBoundary:
      "Public proof may show hashes, receipts, timestamps, and redacted summaries; do not publish private buyer input or full deliverables without consent.",
    privacyRule:
      "Treat buyer inputs and deliverables as private by default. Publish only with explicit consent or after redaction."
  };
  const operationalAccuracy = buildOperationalAccuracyGate(input, domainProfile, {
    positioning,
    serviceMenu,
    requestedServiceCoverage,
    buyerIntake,
    launchCopy,
    operatingRules,
    pricingPlan,
    proofGuidance
  });
  const inputFidelity = {
    passed: missingFields.length === 0,
    matchedFields: draftFidelity.matchedFields,
    missingFields,
    repairedFields: unique(repairedFields),
    warnings:
      repairedFields.length > 0
        ? [
            "The model draft missed buyer-specific details; AgentForge repaired the paid deliverable from the original buyer input. Founder review is still required before listing."
          ]
        : []
  };
  const qualityReport = buildQualityReport({
    input,
    inputFidelity,
    operationalAccuracy,
    requestedServiceCoverage,
    serviceMenu,
    buyerIntake,
    proofGuidance,
    positioning,
    launchCopy,
    operatingRules
  });
  const deliverable = {
    title: "AI Agent Business Builder",
    founder: input.founderName,
    brandName,
    positioning,
    serviceMenu,
    requestedServiceCoverage,
    buyerIntake,
    launchCopy,
    operatingRules,
    pricingPlan,
    proofGuidance,
    qualityReport,
    operationalAccuracy,
    inputFidelity,
    nextActions: [
      "Review the service menu and remove anything the founder cannot truthfully deliver.",
      "Do not publish or reuse the copy until qualityReport.passed and operationalAccuracy.passed are true.",
      "Run one buyer-style test request before listing the service publicly.",
      "Set the launch price only after a real paid call proves the delivery path."
    ]
  };

  assertBusinessBuilderDeliverableReady(deliverable);
  return deliverable;
}

export function assertBusinessBuilderDeliverableReady(deliverable: BusinessBuilderDeliverable) {
  const failures = [
    ...(!deliverable.inputFidelity.passed ? [`inputFidelity: ${deliverable.inputFidelity.missingFields.join(", ")}`] : []),
    ...(!deliverable.operationalAccuracy.passed
      ? [
          `operationalAccuracy: ${deliverable.operationalAccuracy.rulesChecked
            .filter((rule) => !rule.passed)
            .map((rule) => rule.id)
            .join(", ")}`
        ]
      : []),
    ...deliverable.qualityReport.blockingFailures
  ].filter(Boolean);

  if (failures.length > 0) {
    throw new BusinessBuilderQualityError(unique(failures));
  }
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

type DraftFidelity = {
  matchedFields: string[];
  missingServiceSignals: string[];
  repairedFields: string[];
  priceNeedsRepair: boolean;
};

function buildServiceMenu(
  input: FounderInterviewInput,
  draft: AgentSpecDraft,
  brandName: string,
  preferredPriceUsdt: number | null,
  draftFidelity: DraftFidelity,
  buyerIntake: BusinessBuilderDeliverable["buyerIntake"],
  domainProfile: ServiceDomainProfile
): BusinessBuilderDeliverable["serviceMenu"] {
  const firstService = draft.services[0];
  const priceUsdt = preferredPriceUsdt ?? firstService?.price_usdt ?? 0;

  if (domainProfile.domain === "coverage-accountability") {
    const paidReceiptFeeUsdt = preferredPriceUsdt ?? firstService?.price_usdt ?? 0.1;

    return [
      {
        serviceId: `${slugify(brandName)}_eligibility_preflight`,
        title: "Eligibility Preflight",
        description:
          "Free preflight that checks whether an accepted OKX.AI job is eligible under the provider policy, job value, requested cap, and available reserve before any paid receipt is ordered.",
        priceUsdt: 0,
        buyerInputs: coverageBuyerInputs(),
        outputFormat:
          "charged:false eligibility result with provider, job value, SLA source, bounded cap, fee, reserve state, and decline reason when ineligible."
      },
      {
        serviceId: `${slugify(brandName)}_covered_job_receipt`,
        title: "Covered Job Receipt",
        description:
          "Paid covenant receipt for an eligible accepted job. It records the service fee, bounded coverage cap, deadline derived from verified acceptance plus SLA, objective breach rules, and public reserve state.",
        priceUsdt: paidReceiptFeeUsdt,
        buyerInputs: coverageBuyerInputs(),
        outputFormat:
          "Receipt JSON/markdown showing eligibility basis, service fee, cap, derived deadline, breach rules, reserve snapshot, receipt hash, and caveats."
      }
    ];
  }

  if (!firstService || draftFidelity.missingServiceSignals.length > 0) {
    return [
      {
        serviceId: `${slugify(brandName)}_business_pack`,
        title: titleFromService(input.servicesOffered[0] ?? input.expertiseArea),
        description: `${brandName} packages ${input.expertiseArea} for ${input.targetCustomer}. It delivers: ${input.servicesOffered.join("; ")}.`,
        priceUsdt,
        buyerInputs: buyerIntake.required,
        outputFormat:
          firstService?.output_format ??
          `Service menu, launch copy, buyer input checklist, and refusal boundaries tailored to ${input.expertiseArea}.`
      }
    ];
  }

  return draft.services.map((service) => ({
    serviceId: service.service_id,
    title: sanitizeServiceTitle(service.title, input),
    description: sanitizeUnsupportedClaimText(service.description, input, domainProfile.domain),
    priceUsdt: preferredPriceUsdt ?? service.price_usdt,
    buyerInputs: filterBuyerInputsForDomain(
      unique(service.required_inputs.concat(buyerIntake.required)),
      domainProfile.domain
    ),
    outputFormat: sanitizeUnsupportedClaimText(service.output_format, input, domainProfile.domain)
  }));
}

function buildRequestedServiceCoverage(
  input: FounderInterviewInput,
  domainProfile: ServiceDomainProfile
): BusinessBuilderDeliverable["requestedServiceCoverage"] {
  return input.servicesOffered.map((service) => {
    const normalized = service.toLowerCase();

    if (domainProfile.domain === "coverage-accountability") {
      if (matchesAny(normalized, ["preflight", "eligibility"])) {
        return {
          requested: service,
          coveredIn: ["serviceMenu.Eligibility Preflight", "buyerIntake.required", "operationalAccuracy.moneyModel"],
          note: "Handled as the free eligibility preflight, not as a paid receipt fee."
        };
      }

      if (matchesAny(normalized, ["receipt", "covenant", "covered job", "breach rules"])) {
        return {
          requested: service,
          coveredIn: ["serviceMenu.Covered Job Receipt", "pricingPlan", "operationalAccuracy.moneyModel"],
          note: "Handled as the paid receipt service while keeping fee, cap, reserve, and deadline separate."
        };
      }

      if (matchesAny(normalized, ["marketplace", "copy", "checklist", "listing", "buyer-input", "buyer input"])) {
        return {
          requested: service,
          coveredIn: ["launchCopy.marketplaceDescription", "buyerIntake.required", "proofGuidance.receiptChecklist"],
          note:
            "Handled as packaging guidance and buyer-input structure. It is not priced as a separate coverage product unless the founder explicitly creates that paid service."
        };
      }
    }

    return {
      requested: service,
      coveredIn: ["serviceMenu", "buyerIntake.required", "proofGuidance"],
      note: "Handled in the generated service package; founder should remove it before listing if they cannot truthfully deliver it."
    };
  });
}

type ServiceDomain =
  | "agent-security"
  | "wallet-security"
  | "education"
  | "provenance"
  | "launch"
  | "coverage-accountability"
  | "general";

type ServiceDomainProfile = {
  domain: ServiceDomain;
};

function classifyServiceDomain(input: FounderInterviewInput): ServiceDomainProfile {
  const primaryContext = [
    input.expertiseArea,
    ...input.servicesOffered,
    input.brandName ?? ""
  ]
    .join(" ")
    .toLowerCase();

  if (
    matchesAny(primaryContext, [
      "coverage receipt",
      "covered job",
      "covenant receipt",
      "coverage cap",
      "reserve-backed",
      "reserve backed",
      "available reserve",
      "breach rules",
      "deadline accountability",
      "policy verification",
      "eligibility preflight",
      "accepted agent job",
      "accepted job",
      "sla",
      "payout cap",
      "provider policy"
    ])
  ) {
    return { domain: "coverage-accountability" };
  }

  if (
    matchesAny(primaryContext, [
      "payload firewall",
      "payload security",
      "prompt injection",
      "tool-call hijacking",
      "tool call hijacking",
      "hidden unicode",
      "secret exfiltration",
      "exfiltration",
      "endpoint audit",
      "attack battery",
      "untrusted agent",
      "untrusted payload",
      "drain address",
      "attacker payout",
      "sanitize/block",
      "sanitize block",
      "allow/sanitize/block",
      "agent endpoint security"
    ])
  ) {
    return { domain: "agent-security" };
  }

  if (
    matchesAny(primaryContext, [
      "phishing",
      "scam",
      "suspicious",
      "wallet safety",
      "wallet risk",
      "malicious",
      "token contract",
      "transaction request",
      "approval risk",
      "seed phrase"
    ])
  ) {
    return { domain: "wallet-security" };
  }

  if (matchesAny(primaryContext, ["course", "education", "lesson", "workshop", "teacher", "curriculum", "training"])) {
    return { domain: "education" };
  }

  if (matchesAny(primaryContext, ["farm", "supply", "provenance", "supplier", "trace", "inventory"])) {
    return { domain: "provenance" };
  }

  if (
    matchesAny(primaryContext, [
      "launch",
      "listing",
      "marketplace",
      "agent profile",
      "asp listing",
      "service launch",
      "okx.ai listing",
      "okxai listing"
    ])
  ) {
    return { domain: "launch" };
  }

  return { domain: "general" };
}

function buildBuyerIntake(
  input: FounderInterviewInput,
  domainProfile: ServiceDomainProfile
): BusinessBuilderDeliverable["buyerIntake"] {
  if (domainProfile.domain === "coverage-accountability") {
    return {
      required: coverageBuyerInputs(),
      optionalProofAssets: [
        "Target job page, task transcript, deliverable hash, or submitted file reference",
        "Provider policy/SLA reference if already public",
        "Reserve-state URL or receipt if already available",
        "Any buyer-visible acceptance or submission timestamps"
      ],
      doNotSend: unique([
        "Seed phrases, private keys, wallet passwords, API keys, or one-time codes",
        "Unredacted private buyer/provider messages unless they are required evidence and both parties consent",
        "A buyer-chosen covenant deadline; derive deadline from verified acceptance time plus the provider's published SLA",
        "Coverage requests above the target job value, published cap, or available reserve",
        "Insurance, guaranteed-outcome, or automatic-settlement claims"
      ]),
      privacyNote:
        "Coverage inputs and receipts should be private by default. Public proof should use job ids, transaction hashes, reserve snapshots, receipt hashes, and redacted summaries unless the buyer gives explicit consent."
    };
  }

  const required = unique([
    "The specific outcome the buyer wants from this service",
    "Relevant public context, links, screenshots, pasted text, or documents the buyer is allowed to share",
    "The decision the buyer needs to make after receiving the output",
    "Any deadline, platform, chain, market, audience, or operating constraint that changes the answer",
    ...domainSpecificRequiredInputs(domainProfile.domain)
  ]);
  const optionalProofAssets = unique([
    "Public URLs or listing links",
    "Transaction hashes, receipt ids, service ids, or task ids if already available",
    "Screenshots or pasted text with private details redacted",
    ...domainSpecificProofAssets(domainProfile.domain)
  ]);
  const doNotSend = unique([
    "Seed phrases, private keys, wallet passwords, API keys, or one-time codes",
    "Unredacted personal documents unless the service explicitly requires them and the buyer consents",
    "Claims the buyer cannot back with evidence",
    ...domainSpecificDoNotSend(domainProfile.domain)
  ]);

  return {
    required,
    optionalProofAssets,
    doNotSend,
    privacyNote:
      "Buyer inputs and deliverables should be private by default. Public proof should use hashes, transaction refs, service ids, or redacted summaries unless the buyer gives explicit consent."
  };
}

function domainSpecificRequiredInputs(domain: ServiceDomain) {
  if (domain === "coverage-accountability") {
    return coverageBuyerInputs();
  }

  if (domain === "wallet-security") {
    return [
      "Suspicious URL, message text, token contract, wallet prompt, or transaction hash to review",
      "Chain/network and token symbol or contract address, if relevant",
      "What action the site, sender, or app is asking the buyer to take",
      "Whether the buyer has already connected a wallet, signed anything, or moved funds"
    ];
  }

  if (domain === "agent-security") {
    return [
      "Untrusted payload, message, tool output, or endpoint response to screen",
      "Target endpoint URL plus explicit authorization when requesting an endpoint audit",
      "Expected agent action after receiving the payload or endpoint response",
      "Known safe recipient or payout addresses when address substitution is part of the risk",
      "Any public badge, report, or callback preference for authorized audit results"
    ];
  }

  if (domain === "education") {
    return [
      "Raw notes, topic list, workshop outline, or teaching material the buyer owns or may reuse",
      "Target learner and current skill level",
      "Learning outcome the buyer wants students to achieve",
      "Format constraint such as mini-course, lesson plan, worksheet, or launch post"
    ];
  }

  if (domain === "provenance") {
    return [
      "The exact claim, source note, product batch, supplier, or provenance statement to package",
      "Dates, locations, public records, receipts, photos, or documents the buyer is allowed to share",
      "Which parts are verified, self-reported, unknown, or unavailable",
      "Claims the buyer wants the service to avoid"
    ];
  }

  if (domain === "launch") {
    return [
      "Current listing draft, service description, or agent profile copy",
      "Live URL, endpoint, agent id, service id, or marketplace status if already available",
      "Known blocker, review feedback, or launch concern the buyer wants addressed",
      "Target buyer segment and the proof assets the service can truthfully show"
    ];
  }

  return [];
}

function domainSpecificProofAssets(domain: ServiceDomain) {
  if (domain === "coverage-accountability") {
    return [
      "Accepted target-job transaction references",
      "Provider policy/SLA reference",
      "Reserve-state snapshot",
      "Receipt hash or prior coverage receipt"
    ];
  }

  if (domain === "wallet-security") {
    return ["Public explorer links", "Domain, token, or contract pages", "Redacted screenshots of the suspicious message or prompt"];
  }

  if (domain === "agent-security") {
    return [
      "Redacted payload samples",
      "Owned endpoint URL for authorized testing",
      "Expected safe tool-call schema",
      "Known-good payout or recipient addresses",
      "Prior audit badge or report hash"
    ];
  }

  if (domain === "education") {
    return ["Owned notes or slides", "Learner persona", "Example outcome or assignment"];
  }

  if (domain === "provenance") {
    return ["Receipts or source documents", "Product photos with private data redacted", "Public supplier or batch references"];
  }

  if (domain === "launch") {
    return ["Marketplace listing URL", "Service endpoint URL", "Prior review feedback", "Existing proof-of-service receipts"];
  }

  return [];
}

function domainSpecificDoNotSend(domain: ServiceDomain) {
  if (domain === "coverage-accountability") {
    return [
      "Do not ask the buyer to choose the covenant deadline; derive it from verified acceptance plus published SLA",
      "Do not submit insurance, guaranteed payout, automatic settlement, or universal coverage claims"
    ];
  }

  if (domain === "wallet-security") {
    return ["Do not connect a wallet, sign a transaction, or paste recovery material into the service request"];
  }

  if (domain === "agent-security") {
    return [
      "Do not send private keys, seed phrases, API keys, platform credentials, hidden prompts, or unrelated private logs",
      "Do not request endpoint testing unless the buyer owns or is authorized to test the target"
    ];
  }

  if (domain === "education") {
    return ["Do not send copyrighted curriculum the buyer does not own or have permission to reuse"];
  }

  return [];
}

function filterBuyerInputsForDomain(inputs: string[], domain: ServiceDomain) {
  return inputs.filter((input) => {
    const restrictedDomain = restrictedDomainForBuyerInput(input);
    return restrictedDomain === null || restrictedDomain === domain;
  });
}

function restrictedDomainForBuyerInput(input: string): ServiceDomain | null {
  const normalized = input.toLowerCase();

  if (
    matchesAny(normalized, [
      "suspicious url",
      "token contract",
      "wallet prompt",
      "transaction hash",
      "chain/network",
      "already connected a wallet",
      "signed anything",
      "moved funds",
      "public explorer",
      "contract pages"
    ])
  ) {
    return "wallet-security";
  }

  if (
    matchesAny(normalized, [
      "untrusted payload",
      "tool output",
      "endpoint response",
      "target endpoint url",
      "authorization",
      "agent action",
      "address substitution",
      "audit results",
      "tool-call schema",
      "payload samples",
      "owned endpoint"
    ])
  ) {
    return "agent-security";
  }

  if (
    matchesAny(normalized, [
      "current listing draft",
      "agent profile copy",
      "agent id",
      "service id",
      "marketplace status",
      "launch concern",
      "marketplace listing url",
      "service endpoint url",
      "proof-of-service receipts"
    ])
  ) {
    return "launch";
  }

  if (
    matchesAny(normalized, [
      "targetjobid",
      "target job id",
      "targetcreationtxhash",
      "target creation",
      "targetacceptancetxhash",
      "target acceptance",
      "accepted job",
      "requestedcoverageusdt",
      "requested coverage",
      "coverage cap",
      "reserve state",
      "published sla",
      "breach rules",
      "provider policy"
    ])
  ) {
    return "coverage-accountability";
  }

  if (
    matchesAny(normalized, [
      "workshop outline",
      "teaching material",
      "target learner",
      "learning outcome",
      "mini-course",
      "lesson plan",
      "worksheet"
    ])
  ) {
    return "education";
  }

  if (
    matchesAny(normalized, [
      "product batch",
      "supplier",
      "provenance statement",
      "self-reported",
      "source documents",
      "batch references"
    ])
  ) {
    return "provenance";
  }

  return null;
}

function buildDomainPromise(
  input: FounderInterviewInput,
  brandName: string,
  domainProfile: ServiceDomainProfile,
  fallback?: string
) {
  if (domainProfile.domain === "agent-security") {
    return `${brandName} packages deterministic agent-payload security into paid services for screening untrusted payloads and auditing authorized endpoints before an agent acts.`;
  }

  if (domainProfile.domain !== "coverage-accountability") {
    return fallback;
  }

  return `${brandName} checks eligible accepted OKX.AI jobs, runs a free eligibility preflight, and issues a paid reserve-bounded covenant receipt that records the fee, cap, deadline derived from verified acceptance plus SLA, breach rules, and public reserve state.`;
}

function buildDomainProfileBio(
  input: FounderInterviewInput,
  brandName: string,
  domainProfile: ServiceDomainProfile,
  draftBio: string
) {
  if (domainProfile.domain === "coverage-accountability") {
    return `${brandName} provides proof-of-service accountability receipts for opted-in OKX.AI agent jobs. It starts with a free eligibility preflight, then paid receipts document policy fit, service fee, bounded coverage cap, derived deadline, breach rules, and reserve state. It is not insurance and does not guarantee outcomes.`;
  }

  if (domainProfile.domain === "agent-security") {
    return `${brandName} is a deterministic payload security service for agent operators. It screens untrusted messages, tool outputs, endpoint responses, and authorized audit targets for injection, tool-call hijacking, hidden Unicode, attacker payout addresses, and secret exfiltration before an agent acts.`;
  }

  return shouldUseDraftBio(draftBio, input, brandName)
    ? draftBio
    : `${brandName} serves ${input.targetCustomer}. It turns ${input.expertiseArea} into buyer-ready service outputs.`;
}

function buildMarketplaceDescription(
  input: FounderInterviewInput,
  brandName: string,
  domainProfile: ServiceDomainProfile
) {
  if (domainProfile.domain === "coverage-accountability") {
    return [
      `${brandName} serves ${input.targetCustomer}.`,
      "It documents objective deadline accountability for eligible accepted OKX.AI jobs.",
      "Free preflight checks eligibility before payment.",
      "Paid receipts record the fee, bounded cap, deadline derived from verified acceptance plus SLA, breach rules, and reserve state.",
      "Not insurance; no universal coverage, automatic settlement, guaranteed payout, or coverage beyond reserve capacity."
    ].join("\n");
  }

  if (domainProfile.domain === "agent-security") {
    return [
      `${brandName} serves ${input.targetCustomer}.`,
      "It screens untrusted inbound payloads before their agents act.",
      "Payload scans return an ALLOW, SANITIZE, or BLOCK verdict with threat classes, confidence, evidence, and safe next action.",
      "Authorized endpoint audits run a defined attack battery against requester-approved targets and return a graded report or signed badge only when supported by the actual result.",
      `${brandName} does not judge agents from listing text alone, manufacture reviews or status, request secrets, or test endpoints without authorization.`
    ].join("\n");
  }

  return [
    `${brandName} serves ${input.targetCustomer}.`,
    `It helps with ${input.expertiseArea}.`,
    `Buyers provide: ${unique(input.servicesOffered).slice(0, 4).join(", ")}.`
  ].join("\n");
}

function buildFirstPost(input: FounderInterviewInput, brandName: string, domainProfile: ServiceDomainProfile) {
  if (domainProfile.domain === "coverage-accountability") {
    return [
      `I am launching ${brandName}: proof-of-service accountability receipts for opted-in OKX.AI agent jobs.`,
      "Start with the free eligibility preflight.",
      "If eligible, the paid receipt documents the service fee, bounded cap, SLA-derived deadline, breach rules, and reserve state without claiming insurance or guaranteed outcomes."
    ].join(" ");
  }

  if (domainProfile.domain === "agent-security") {
    return [
      `Launching ${brandName} for OKX.AI agent operators: deterministic payload security before autonomous action.`,
      "Send an untrusted payload for an ALLOW/SANITIZE/BLOCK verdict, or request an authorized endpoint audit for a graded report.",
      "No endpoint is tested without authorization and no private keys, seed phrases, or platform credentials are accepted."
    ].join(" ");
  }

  return [
    `I am launching ${brandName}: a focused AI service for ${input.targetCustomer}.`,
    `It turns ${input.expertiseArea} into practical, paid outputs with clear boundaries and buyer inputs.`,
    "Reply with the problem you want packaged into a service."
  ].join(" ");
}

// Category is a coarse taxonomy tag, not buyer-facing prose. For domains where the correct value
// is not actually ambiguous, assign it directly instead of only repairing specific wrong values
// the model happens to have produced (finance mislabeled agent-security and wallet-security drafts
// on live runs; there is no reason to assume "finance" is the only wrong value it could produce).
// "general" is the one domain where the founder's actual business can genuinely be anything, so it
// stays model-driven.
const domainDefaultCategory: Partial<Record<ServiceDomain, string>> = {
  "coverage-accountability": "business",
  "agent-security": "software",
  "wallet-security": "software",
  education: "education",
  provenance: "business",
  launch: "business"
};

function domainPositioningCategory(domain: ServiceDomain, draftCategory: string) {
  return domainDefaultCategory[domain] ?? draftCategory;
}

function coverageBuyerInputs() {
  return [
    "targetAgent: registered target agent id, service id, or public service name",
    "targetJobId: accepted OKX.AI job id",
    "targetCreationTxHash: X Layer transaction that created the target job",
    "targetAcceptanceTxHash: X Layer transaction that moved the target job to accepted",
    "jobDescription: target job scope being covered",
    "requestedCoverageUSDT: requested cap, bounded by target job value, published policy, and uncommitted reserve",
    "provider policy/SLA reference or enough public context to derive the deadline from verified acceptance plus SLA"
  ];
}

function domainSpecificRefusalPolicy(domain: ServiceDomain) {
  if (domain === "coverage-accountability") {
    return [
      "Do not describe the service as insurance or regulated financial protection.",
      "Do not promise universal coverage, guaranteed outcomes, guaranteed payout, or automatic settlement.",
      "Do not say a covenant is signed, anchored, funded, or active unless the receipt evidence proves that state.",
      "Do not let the buyer choose the covenant deadline; derive it from verified acceptance time plus the provider's published SLA.",
      "Do not cover non-opted-in or unregistered providers, non-accepted jobs, or amounts above target job value, policy cap, or available reserve."
    ];
  }

  if (domain === "agent-security") {
    return [
      "Do not judge another agent as insecure from listing text alone; require a supplied payload or authorized endpoint target.",
      "Do not test endpoints unless the requester owns or is authorized to test the target.",
      "Do not request, store, or process private keys, seed phrases, platform credentials, hidden prompts, or unrelated private logs.",
      "Do not manufacture reviews, revenue, ratings, marketplace status, badges, or audit results."
    ];
  }

  return [];
}

function domainSpecificOutOfScope(domain: ServiceDomain) {
  if (domain === "coverage-accountability") {
    return [
      "Insurance, underwriting, legal advice, or regulated financial guarantees",
      "Coverage for providers that have not opted in or jobs that are not accepted",
      "Automatic fund movement, payout execution, or settlement outside the explicit reserve policy",
      "Risk ratings or provider quality scores not backed by the stated policy evidence"
    ];
  }

  if (domain === "agent-security") {
    return [
      "Unauthorized endpoint testing or exploit chaining beyond the declared audit battery",
      "Secret collection, credential handling, wallet custody, or private-key recovery",
      "Claims about an agent's security posture without a provided payload or authorized endpoint test",
      "Fake audit badges, fake marketplace reviews, or unverifiable security claims"
    ];
  }

  return [];
}

function buildQualityReport(input: {
  input: FounderInterviewInput;
  inputFidelity: BusinessBuilderDeliverable["inputFidelity"];
  operationalAccuracy: BusinessBuilderDeliverable["operationalAccuracy"];
  requestedServiceCoverage: BusinessBuilderDeliverable["requestedServiceCoverage"];
  serviceMenu: BusinessBuilderDeliverable["serviceMenu"];
  buyerIntake: BusinessBuilderDeliverable["buyerIntake"];
  proofGuidance: BusinessBuilderDeliverable["proofGuidance"];
  positioning: BusinessBuilderDeliverable["positioning"];
  launchCopy: BusinessBuilderDeliverable["launchCopy"];
  operatingRules: BusinessBuilderDeliverable["operatingRules"];
}): BusinessBuilderDeliverable["qualityReport"] {
  const publicCopy = JSON.stringify(input.launchCopy).toLowerCase();
  const operatingRules = JSON.stringify(input.operatingRules).toLowerCase();
  // requestedServiceCoverage is a 1:1 map over servicesOffered, so checking it against itself is a
  // tautology (and re-including it here would just reintroduce that). What can actually go wrong
  // (and has, per ops/lessons.md's "Do not silently canonicalize away buyer-requested services") is
  // a requested item disappearing from the *actual* buyer-facing deliverable. Some domains address
  // a request through serviceMenu, others through launchCopy/buyerIntake/proofGuidance/positioning
  // (e.g. coverage-accountability's "policy fit" lives in the profile bio, and its "marketplace
  // copy/checklist" request is deliberately handled via launchCopy + buyerIntake + proofGuidance,
  // never as its own serviceMenu line) -- so check the whole buyer-facing surface, not one section.
  const deliverableSurfaceText = JSON.stringify({
    serviceMenu: input.serviceMenu,
    buyerIntake: input.buyerIntake,
    proofGuidance: input.proofGuidance,
    positioning: input.positioning,
    launchCopy: input.launchCopy
  }).toLowerCase();
  const uncoveredServices = input.input.servicesOffered.filter(
    (service) => !containsSignal(deliverableSurfaceText, service)
  );
  const checks = [
    {
      id: "input_fidelity",
      label: "Input fidelity",
      passed: input.inputFidelity.passed,
      detail:
        input.inputFidelity.missingFields.length === 0
          ? "Founder, customer, services, boundaries, tone, and pricing signals are represented."
          : `Missing fields: ${input.inputFidelity.missingFields.join(", ")}`
    },
    {
      id: "requested_service_coverage",
      label: "Requested service coverage",
      passed: uncoveredServices.length === 0,
      detail:
        uncoveredServices.length === 0
          ? "Every buyer-requested service is reflected in the final service menu."
          : `Not reflected in the final service menu: ${uncoveredServices.join("; ")}`
    },
    {
      id: "boundary_compliance",
      label: "Boundary compliance",
      passed: input.input.boundaries.every((boundary) => containsSignal(operatingRules, boundary)),
      detail: "Buyer-stated boundaries are visible in operating rules and refusal policy."
    },
    {
      id: "forbidden_claim_check",
      label: "Forbidden-claim check",
      passed: input.operationalAccuracy.forbiddenClaimDrift.length === 0,
      detail:
        input.operationalAccuracy.forbiddenClaimDrift.length === 0
          ? "No unsupported guarantee, fake proof, automatic settlement, or signed-badge drift was detected."
          : `Detected: ${input.operationalAccuracy.forbiddenClaimDrift.join(", ")}`
    },
    {
      id: "review_claim_safety",
      label: "Review-claim safety",
      passed: !containsForbiddenClaim(
        publicCopy,
        /\b(verified|independent|public|marketplace)?\s*(reviews?|ratings?|revenue|traction)\b.{0,80}\b(achieved|proven|available|secured|earned)\b/i
      ),
      detail: "Launch copy must not claim reviews, ratings, revenue, or traction unless supplied as evidence."
    },
    {
      id: "operational_accuracy",
      label: "Operational accuracy",
      passed: input.operationalAccuracy.passed,
      detail: "Output must be usable without material correction against buyer-stated operating rules."
    }
  ];
  const blockingFailures = checks.filter((check) => !check.passed).map((check) => check.id);

  return {
    passed: blockingFailures.length === 0,
    launchReadinessVerdict: blockingFailures.length === 0 ? "ready_for_founder_review" : "blocked_until_repaired",
    reviewPolicy:
      "Ask for an honest OKX review only after the buyer has received and inspected the deliverable. Never script, prefill, or imply a positive review.",
    checks,
    blockingFailures
  };
}

function buildOperationalAccuracyGate(
  input: FounderInterviewInput,
  domainProfile: ServiceDomainProfile,
  deliverable: {
    positioning: BusinessBuilderDeliverable["positioning"];
    serviceMenu: BusinessBuilderDeliverable["serviceMenu"];
    requestedServiceCoverage: BusinessBuilderDeliverable["requestedServiceCoverage"];
    buyerIntake: BusinessBuilderDeliverable["buyerIntake"];
    launchCopy: BusinessBuilderDeliverable["launchCopy"];
    operatingRules: BusinessBuilderDeliverable["operatingRules"];
    pricingPlan: BusinessBuilderDeliverable["pricingPlan"];
    proofGuidance: BusinessBuilderDeliverable["proofGuidance"];
  }
): BusinessBuilderDeliverable["operationalAccuracy"] {
  const publicClaimText = JSON.stringify({
    positioning: deliverable.positioning,
    serviceMenu: deliverable.serviceMenu,
    launchCopy: deliverable.launchCopy,
    pricingPlan: deliverable.pricingPlan,
    proofGuidance: deliverable.proofGuidance
  }).toLowerCase();
  const operatingRuleText = JSON.stringify(deliverable.operatingRules).toLowerCase();
  const forbiddenClaimDrift = findForbiddenClaimDrift(publicClaimText, domainProfile.domain);
  const rulesChecked = buildOperationalRules(input, domainProfile, deliverable, publicClaimText, operatingRuleText);
  const warnings = [
    ...(!rulesChecked.every((rule) => rule.passed)
      ? ["One or more operating rules did not pass; founder review is required before using this copy."]
      : []),
    ...(forbiddenClaimDrift.length > 0
      ? ["Public claim surfaces contain unsupported claim drift; do not publish until corrected."]
      : [])
  ];

  return {
    passed: rulesChecked.every((rule) => rule.passed) && forbiddenClaimDrift.length === 0,
    domain: domainProfile.domain,
    requirement: "Usable without material correction against buyer-stated operating rules.",
    moneyModel: buildMoneyModel(domainProfile.domain, deliverable),
    rulesChecked,
    forbiddenClaimDrift,
    warnings
  };
}

function buildMoneyModel(
  domain: ServiceDomain,
  deliverable: {
    serviceMenu: BusinessBuilderDeliverable["serviceMenu"];
    pricingPlan: BusinessBuilderDeliverable["pricingPlan"];
  }
): BusinessBuilderDeliverable["operationalAccuracy"]["moneyModel"] {
  if (domain === "coverage-accountability") {
    const preflight = deliverable.serviceMenu.find((service) => service.title === "Eligibility Preflight");
    const receipt = deliverable.serviceMenu.find((service) => service.title === "Covered Job Receipt");

    return [
      {
        label: "eligibility preflight",
        amountUsdt: preflight?.priceUsdt ?? null,
        source: "domain rule",
        constraint: "Must remain free and run before paid receipt."
      },
      {
        label: "paid receipt service fee",
        amountUsdt: receipt?.priceUsdt ?? deliverable.pricingPlan.launchPriceUsdt,
        source: deliverable.pricingPlan.source,
        constraint: "Service revenue only; not the coverage cap."
      },
      {
        label: "requested coverage cap",
        amountUsdt: null,
        source: "buyer request plus policy/reserve check",
        constraint: "Bounded by target job value, published policy, and uncommitted reserve."
      },
      {
        label: "reserve capacity",
        amountUsdt: null,
        source: "public reserve state",
        constraint: "Limits coverage; does not guarantee automatic settlement."
      }
    ];
  }

  return deliverable.serviceMenu.map((service) => ({
    label: `${service.title} service fee`,
    amountUsdt: service.priceUsdt,
    source: deliverable.pricingPlan.source,
    constraint: "Paid call price; revise only after real buyer proof and low-rating/repeated-confusion review."
  }));
}

function buildOperationalRules(
  input: FounderInterviewInput,
  domainProfile: ServiceDomainProfile,
  deliverable: {
    serviceMenu: BusinessBuilderDeliverable["serviceMenu"];
    buyerIntake: BusinessBuilderDeliverable["buyerIntake"];
    operatingRules: BusinessBuilderDeliverable["operatingRules"];
  },
  publicClaimText: string,
  operatingRuleText: string
): BusinessBuilderDeliverable["operationalAccuracy"]["rulesChecked"] {
  const boundaryText = input.boundaries.join(" ");
  const rules: BusinessBuilderDeliverable["operationalAccuracy"]["rulesChecked"] = [
    {
      id: "buyer_stated_boundaries_visible",
      passed: input.boundaries.every((boundary) => containsSignal(operatingRuleText, boundary)),
      detail: "Buyer-stated boundaries must appear in operating rules, not disappear into generic copy."
    },
    {
      id: "specific_buyer_inputs_present",
      passed: deliverable.buyerIntake.required.length >= 3 && deliverable.serviceMenu.every((service) => service.buyerInputs.length >= 3),
      detail: "Every service must tell buyers what concrete input is required before payment."
    },
    {
      id: "unsupported_claim_scan",
      passed: findForbiddenClaimDrift(publicClaimText, domainProfile.domain).length === 0,
      detail: "Public claim surfaces must not contain unsupported guarantees, settlement claims, insurance drift, or fake proof."
    },
    {
      id: "privacy_and_evidence_rule_present",
      passed:
        /private by default/i.test(deliverable.buyerIntake.privacyNote) &&
        deliverable.buyerIntake.doNotSend.some((item) => /seed phrases|private keys|claims the buyer cannot back/i.test(item)),
      detail: "Buyer input rules must preserve privacy and reject secrets or unsupported claims."
    }
  ];

  if (/guarantee|approval|revenue|rating|customer|outcome/i.test(boundaryText)) {
    rules.push({
      id: "no_guarantee_drift",
      passed: !containsForbiddenClaim(
        publicClaimText,
        /\bguarantee[sd]?\b.{0,80}\b(approval|revenue|rating|customers?|outcomes?|sales)\b/i
      ),
      detail: "If the buyer forbids guarantees, public copy must not promise approval, revenue, ratings, customers, sales, or outcomes."
    });
  }

  if (domainProfile.domain === "coverage-accountability") {
    const preflight = deliverable.serviceMenu.find((service) => service.title === "Eligibility Preflight");
    const receipt = deliverable.serviceMenu.find((service) => service.title === "Covered Job Receipt");

    rules.push(
      {
        id: "free_preflight_before_payment",
        passed: preflight?.priceUsdt === 0,
        detail: "Eligibility preflight must stay free and precede the paid receipt."
      },
      {
        id: "fee_cap_reserve_separated",
        passed:
          Boolean(receipt && receipt.priceUsdt > 0) &&
          publicClaimText.includes("coverage caps are separate from the service fee") &&
          publicClaimText.includes("bounded"),
        detail: "Paid receipt fee, requested coverage cap, and reserve capacity must be distinct concepts."
      },
      {
        id: "deadline_derivation_rule",
        passed:
          publicClaimText.includes("deadline derived from verified acceptance plus sla") &&
          !/buyer[- ]selected deadline|buyer.*supply.*deadline|buyer.*choose.*deadline/i.test(publicClaimText),
        detail: "Coverage deadline must be derived from verified acceptance plus SLA, not supplied by the buyer."
      },
      {
        id: "non_insurance_caveat",
        passed:
          publicClaimText.includes("not insurance") &&
          !/\b(insurance product|regulated insurance|underwriting service)\b/i.test(publicClaimText),
        detail: "Coverage accountability copy must not become insurance/underwriting copy."
      }
    );
  }

  return rules;
}

function findForbiddenClaimDrift(publicClaimText: string, domain: ServiceDomain) {
  const patterns: Array<[RegExp, string]> = [
    [/\bguarantee[sd]?\b.{0,80}\b(approval|revenue|ratings?|customers?|outcomes?|sales)\b/i, "unsupported guarantee claim"],
    [/\b(fake|invented|simulated)\b.{0,80}\b(reviews?|customers?|revenue|traction|receipts?|transactions?)\b/i, "fake proof claim"],
    [/\bautomatic\b.{0,40}\b(settlement|payout|refund|coverage)\b/i, "automatic settlement/payout claim"],
    [/\bguaranteed\b.{0,40}\bpayout\b/i, "guaranteed payout claim"],
    [/\bpayout review\b/i, "payout review drift"],
    [/\bbuyer[- ]selected deadline\b/i, "buyer-selected deadline drift"],
    [/\bbuyer\b.{0,40}\b(choose|supply|set|provide)\b.{0,30}\bdeadline\b/i, "buyer-supplied deadline drift"],
    [/\bsigned covenant\b/i, "unsupported signed covenant claim"]
  ];

  if (domain === "coverage-accountability") {
    patterns.push(
      [/\binsurance product\b/i, "insurance product drift"],
      [/\bregulated insurance\b/i, "regulated insurance drift"],
      [/\bunderwriting service\b/i, "underwriting drift"],
      [/\brisk ratings?\b/i, "risk-rating drift"]
    );
  }

  return patterns
    .filter(([pattern]) => containsForbiddenClaim(publicClaimText, pattern))
    .map(([, label]) => label);
}

function containsForbiddenClaim(publicClaimText: string, pattern: RegExp) {
  const flags = unique(`${pattern.flags}g`.split("")).join("");
  const matcher = new RegExp(pattern.source, flags);

  return [...publicClaimText.matchAll(matcher)].some((match) => {
    const index = match.index ?? 0;
    return !isNegatedClaimContext(publicClaimText, index, match[0].length);
  });
}

function isNegatedClaimContext(publicClaimText: string, index: number, matchLength: number) {
  const prefix = publicClaimText.slice(Math.max(0, index - 120), index);
  const context = publicClaimText.slice(Math.max(0, index - 120), Math.min(publicClaimText.length, index + matchLength + 80));

  return (
    /\b(no|not|without|avoid(?:s|ing)?|do not|does not|must not|cannot|can't|never)\b[^.!?{}[\]\n]{0,120}$/i.test(prefix) ||
    /\b(do not|does not|must not|cannot|can't|never|without claiming|without promising|avoid(?:s|ing)?)\b[^.!?{}[\]\n]{0,160}\b(guarantee|claim|promise|describe|say|automatic|payout|settlement|insurance|underwriting|risk rating)/i.test(context)
  );
}

function sanitizeServiceTitle(title: string, input: FounderInterviewInput) {
  if (/\bguarantee[sd]?\b/i.test(title) && /guarantee|approval|revenue|rating|customer|outcome/i.test(input.boundaries.join(" "))) {
    return title.replace(/\bguarantee[sd]?\b/gi, "Evidence-Guided");
  }

  return title;
}

function sanitizeUnsupportedClaimText(value: string, input: FounderInterviewInput, domain: ServiceDomain) {
  const boundaryText = input.boundaries.join(" ");
  const forbidsGuarantees = /guarantee|approval|revenue|rating|customer|outcome|sales/i.test(boundaryText);
  const replacementSentences = new Set<string>();
  let sanitized = value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      if (forbidsGuarantees && /\bguarantee[sd]?\b.{0,80}\b(approval|revenue|ratings?|customers?|outcomes?|sales)\b/i.test(sentence)) {
        const replacement =
          "Provides evidence-based guidance while avoiding approval, revenue, rating, customer, sales, or outcome guarantees.";
        replacementSentences.add(replacement);
        return replacement;
      }

      if (/\bautomatic\b.{0,40}\b(settlement|payout|refund|coverage)\b/i.test(sentence)) {
        const replacement = "Documents rules and evidence without claiming automatic settlement, payout, refund, or coverage.";
        replacementSentences.add(replacement);
        return replacement;
      }

      if (/\bguaranteed\b.{0,40}\bpayout\b/i.test(sentence)) {
        const replacement = "States payout limits conservatively and avoids guaranteed payout claims.";
        replacementSentences.add(replacement);
        return replacement;
      }

      if (/\b(fake|invented|simulated)\b.{0,80}\b(reviews?|customers?|revenue|traction|receipts?|transactions?)\b/i.test(sentence)) {
        const replacement =
          "Presents only real reviews, customers, revenue, traction, receipts, or transactions the founder can back with evidence.";
        replacementSentences.add(replacement);
        return replacement;
      }

      return sentence;
    })
    .join(" ");

  if (domain === "coverage-accountability") {
    sanitized = sanitized
      .replace(/\bsigned covenant\b/gi, "covenant receipt")
      .replace(/\bpayout review\b/gi, "objective breach-rule review")
      .replace(/\bbuyer[- ]selected deadline\b/gi, "SLA-derived deadline")
      .replace(/\bregulated insurance\b/gi, "proof-of-service accountability")
      .replace(/\binsurance product\b/gi, "proof-of-service accountability product")
      .replace(/\bunderwriting service\b/gi, "policy-verification service")
      .replace(/\brisk ratings?\b/gi, "policy eligibility notes");
  }

  return unique([sanitized, ...replacementSentences]).join(" ");
}

function matchesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function evaluateDraftFidelity(
  input: FounderInterviewInput,
  draft: AgentSpecDraft,
  preferredPriceUsdt: number | null
): DraftFidelity {
  const draftText = JSON.stringify(draft);
  const missingServiceSignals = input.servicesOffered.filter((service) => !containsSignal(draftText, service));
  const priceNeedsRepair =
    preferredPriceUsdt !== null &&
    !draft.services.some((service) => Math.abs(service.price_usdt - preferredPriceUsdt) < 0.000001);

  return {
    matchedFields: [
      ...(!missingServiceSignals.length ? ["servicesOffered"] : []),
      ...(input.boundaries.every((boundary) => containsSignal(draftText, boundary)) ? ["boundaries"] : []),
      ...(preferredPriceUsdt === null || !priceNeedsRepair ? ["pricingPreference"] : [])
    ],
    missingServiceSignals,
    priceNeedsRepair,
    repairedFields: [
      ...missingServiceSignals.map((service) => `service:${service}`),
      ...(priceNeedsRepair ? ["pricingPreference"] : [])
    ]
  };
}

function evaluateDeliverableMissingFields(
  input: FounderInterviewInput,
  deliverable: {
    founder: string;
    brandName: string;
    customer: string;
    servicePromise: string;
    serviceMenu: BusinessBuilderDeliverable["serviceMenu"];
    requestedServiceCoverage: BusinessBuilderDeliverable["requestedServiceCoverage"];
    launchCopy: BusinessBuilderDeliverable["launchCopy"];
    profileBio: string;
    refusalPolicy: string[];
  }
) {
  const text = JSON.stringify(deliverable);
  const requiredSignals = [
    { field: "founderName", value: input.founderName },
    { field: "brandName", value: input.brandName ?? deliverable.brandName },
    { field: "targetCustomer", value: input.targetCustomer },
    { field: "expertiseArea", value: input.expertiseArea },
    ...input.servicesOffered.map((value, index) => ({ field: `servicesOffered[${index}]`, value })),
    ...input.boundaries.map((value, index) => ({ field: `boundaries[${index}]`, value }))
  ];

  return requiredSignals
    .filter((signal) => !containsSignal(text, signal.value))
    .map((signal) => signal.field);
}

function shouldUseDraftBio(bio: string, input: FounderInterviewInput, brandName: string) {
  return (
    containsSignal(bio, brandName) ||
    containsSignal(bio, input.targetCustomer) ||
    containsSignal(bio, input.expertiseArea)
  );
}

function containsSignal(haystack: string, needle: string) {
  const haystackTokens = significantTokens(haystack);
  const needleTokens = significantTokens(needle);
  const needleTokenList = [...needleTokens];

  if (needleTokenList.length === 0) {
    return true;
  }

  const matched = needleTokenList.filter((token) => haystackTokens.has(token)).length;
  const required = Math.min(needleTokenList.length, Math.max(2, Math.ceil(needleTokenList.length * 0.4)));
  return matched >= required;
}

function significantTokens(value: string) {
  const stopWords = new Set([
    "with",
    "from",
    "that",
    "this",
    "into",
    "after",
    "before",
    "while",
    "using",
    "their",
    "they",
    "them",
    "founder",
    "service",
    "services",
    "buyer",
    "buyers"
  ]);

  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !stopWords.has(token))
  );
}

function parsePriceUsdt(value: string) {
  const match = value.match(/(?:^|\s)(\d+(?:\.\d{1,6})?)\s*(?:usdt|usd)?\b/i);

  if (!match?.[1]) {
    return null;
  }

  return Number(match[1]);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "custom"
  );
}

function titleFromService(value: string) {
  const words = value
    .replace(/[^a-z0-9\s-]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase());

  return `${words.join(" ")} Pack`;
}
