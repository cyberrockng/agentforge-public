import { describe, expect, it } from "vitest";
import type { AgentSpecDraft, FounderInterviewInput } from "@agentforge/core";
import {
  assertBusinessBuilderDeliverableReady,
  buildBusinessBuilderDeliverable,
  BusinessBuilderQualityError
} from "./business-builder.js";

const genericDraft = {
  agent_name: "Generic Launch Agent",
  category: "business",
  persona: {
    system_prompt: "Help with generic launch planning.",
    tone: "clear",
    bio: "A generic launch support agent."
  },
  services: [
    {
      service_id: "generic_launch_review",
      title: "Generic Launch Review",
      description: "Reviews a launch plan for generic gaps.",
      price_usdt: 15,
      required_inputs: ["project summary", "target user"],
      output_format: "generic checklist"
    }
  ],
  boundaries: {
    refusal_policy: ["Do not guarantee outcomes."],
    out_of_scope: ["Private key handling"]
  },
  knowledge: {
    facts: ["AgentForge requires evidence for public claims."],
    documents: []
  }
} satisfies AgentSpecDraft;

const requestDeskDraft = {
  agent_name: "RequestDesk AI",
  category: "business",
  persona: {
    system_prompt: "Turn messy buyer requests into scoped service responses.",
    tone: "plain and practical",
    bio: "RequestDesk AI helps OKX.AI service providers scope messy buyer support messages before responding."
  },
  services: [
    {
      service_id: "scope_from_buyer_notes",
      title: "Buyer Request → Service Scope",
      description:
        "Turns raw buyer support messages into a service scope, flags missing intake fields before payment, and drafts truthful service copy and refusal boundaries.",
      price_usdt: 0.4,
      required_inputs: [
        "Raw buyer message or support note",
        "The ASP's stated service offering",
        "Any constraints the ASP has already communicated to the buyer",
        "Suspicious URL, message text, token contract, wallet prompt, or transaction hash to review"
      ],
      output_format: "Structured scope document"
    }
  ],
  boundaries: {
    refusal_policy: [
      "no fake revenue, ratings, customers, approvals, or guarantees",
      "no private keys, seed phrases, or wallet secrets",
      "no direct listing edits or payment execution on behalf of the buyer"
    ],
    out_of_scope: ["Payment execution", "Wallet custody"]
  },
  knowledge: {
    facts: ["RequestDesk AI is a buyer-request triage service."],
    documents: []
  }
} satisfies AgentSpecDraft;

describe("business-builder deliverable", () => {
  it("adds wallet-safety specific buyer intake for wallet-security services", () => {
    const input: FounderInterviewInput = {
      founderName: "PayloadShield Builder",
      expertiseArea: "wallet safety, suspicious-link triage, and scam-risk explanation for OKX.AI users",
      targetCustomer:
        "new OKX.AI users and small crypto teams who receive suspicious links, wallet prompts, or token offers",
      servicesOffered: [
        "phishing and scam-risk verdict",
        "safe next-step checklist",
        "red-flag explanation for the user"
      ],
      boundaries: [
        "do not ask for seed phrases or private keys",
        "do not guarantee that a URL, token, or wallet is safe",
        "do not sign transactions or move funds"
      ],
      tone: "calm, direct, security-first",
      pricingPreference: "0.40 USDT launch price",
      brandName: "PayloadShield Lite"
    };

    const deliverable = buildBusinessBuilderDeliverable(input, genericDraft);

    expect(deliverable.inputFidelity.passed).toBe(true);
    expect(deliverable.buyerIntake.required).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Suspicious URL"),
        expect.stringContaining("Chain/network"),
        expect.stringContaining("What action"),
        expect.stringContaining("already connected a wallet")
      ])
    );
    expect(deliverable.buyerIntake.optionalProofAssets).toEqual(
      expect.arrayContaining([expect.stringContaining("Public explorer links")])
    );
    expect(deliverable.buyerIntake.doNotSend.join(" ")).toMatch(/Seed phrases|private keys|sign a transaction/i);
    expect(deliverable.serviceMenu[0]?.buyerInputs).toEqual(
      expect.arrayContaining([expect.stringContaining("Suspicious URL")])
    );
  });

  it("adds launch/listing specific buyer intake for OKX.AI service packaging", () => {
    const input: FounderInterviewInput = {
      founderName: "Launch Builder",
      expertiseArea: "OKX.AI listing readiness and service launch packaging",
      targetCustomer: "builders preparing a paid OKX.AI agent service",
      servicesOffered: ["listing mismatch check", "pricing plan", "proof checklist"],
      boundaries: ["no fake approval claims", "no guaranteed revenue"],
      tone: "direct and practical",
      pricingPreference: "0.40 USDT launch price",
      brandName: "LaunchProof"
    };

    const deliverable = buildBusinessBuilderDeliverable(input, genericDraft);

    expect(deliverable.buyerIntake.required).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Current listing draft"),
        expect.stringContaining("Live URL"),
        expect.stringContaining("Known blocker"),
        expect.stringContaining("Target buyer segment")
      ])
    );
    expect(deliverable.buyerIntake.optionalProofAssets).toEqual(
      expect.arrayContaining([expect.stringContaining("Marketplace listing URL")])
    );
    expect(deliverable.pricingPlan.launchPriceUsdt).toBe(0.4);
  });

  it("keeps privacy and evidence boundaries visible in every buyer intake", () => {
    const input: FounderInterviewInput = {
      founderName: "Course Builder",
      expertiseArea: "course-outline packaging for solo educators",
      targetCustomer: "educators turning workshop notes into paid mini-courses",
      servicesOffered: ["course promise audit", "lesson outline", "launch post draft"],
      boundaries: ["no fake student testimonials", "no guaranteed sales"],
      tone: "practical",
      pricingPreference: "0.55 USDT",
      brandName: "CourseForge"
    };

    const deliverable = buildBusinessBuilderDeliverable(input, genericDraft);

    expect(deliverable.buyerIntake.required).toEqual(
      expect.arrayContaining([expect.stringContaining("Raw notes"), expect.stringContaining("Target learner")])
    );
    expect(deliverable.buyerIntake.privacyNote).toMatch(/private by default/i);
    expect(deliverable.buyerIntake.doNotSend).toEqual(
      expect.arrayContaining([expect.stringContaining("Claims the buyer cannot back with evidence")])
    );
  });

  it("does not fuse buyer free text into the general-fallback launch copy templates", () => {
    // Same input as the buyer-intake test above: targetCustomer ends in "...paid mini-courses"
    // and the old fallback templates continued straight on with "turn <expertiseArea>..." / "with
    // <expertiseArea>...", producing an awkward "mini-courses turn course-outline..." run-on for
    // any domain without dedicated launch copy (wallet-security, education, provenance, launch).
    const input: FounderInterviewInput = {
      founderName: "Course Builder",
      expertiseArea: "course-outline packaging for solo educators",
      targetCustomer: "educators turning workshop notes into paid mini-courses",
      servicesOffered: ["course promise audit", "lesson outline", "launch post draft"],
      boundaries: ["no fake student testimonials", "no guaranteed sales"],
      tone: "practical",
      pricingPreference: "0.55 USDT",
      brandName: "CourseForge"
    };

    const deliverable = buildBusinessBuilderDeliverable(input, genericDraft);

    expect(deliverable.launchCopy.profileBio).not.toContain("mini-courses turn");
    expect(deliverable.launchCopy.profileBio).toContain(`CourseForge serves ${input.targetCustomer}`);
    expect(deliverable.launchCopy.marketplaceDescription).not.toContain("mini-courses with");
    expect(deliverable.launchCopy.marketplaceDescription).toContain(`CourseForge serves ${input.targetCustomer}`);
  });

  it("does not infer wallet-security intake from refusal boundaries alone", () => {
    const input: FounderInterviewInput = {
      founderName: "Controlled Buyer Proof #1",
      expertiseArea: "AI customer support triage for small OKX.AI service providers",
      targetCustomer: "new OKX.AI ASPs receiving messy buyer requests and support messages",
      servicesOffered: [
        "turn buyer request notes into a service scope",
        "flag missing intake fields before payment",
        "draft truthful service copy and refusal boundaries"
      ],
      boundaries: [
        "no fake revenue, ratings, customers, approvals, or guarantees",
        "no private keys, seed phrases, or wallet secrets",
        "no direct listing edits or payment execution on behalf of the buyer"
      ],
      tone: "plain, practical, and evidence-first",
      pricingPreference: "0.40 USDT launch price until two or three real paid calls are reviewed",
      brandName: "RequestDesk AI"
    };

    const deliverable = buildBusinessBuilderDeliverable(input, requestDeskDraft);
    const buyerInputText = JSON.stringify(
      deliverable.serviceMenu.flatMap((service) => service.buyerInputs).concat(deliverable.buyerIntake.required)
    ).toLowerCase();

    expect(deliverable.inputFidelity.passed).toBe(true);
    expect(deliverable.serviceMenu[0]?.buyerInputs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Raw buyer message"),
        expect.stringContaining("ASP's stated service offering"),
        expect.stringContaining("specific outcome")
      ])
    );
    expect(buyerInputText).not.toContain("suspicious url");
    expect(buyerInputText).not.toContain("token contract");
    expect(buyerInputText).not.toContain("wallet prompt");
    expect(buyerInputText).not.toContain("transaction hash");
    expect(buyerInputText).not.toContain("chain/network");
    expect(buyerInputText).not.toContain("connected a wallet");
    expect(buyerInputText).not.toContain("marketplace status");
    expect(buyerInputText).not.toContain("agent id");
  });

  it("special-cases PolicyPool-style coverage receipts so free preflight, fee, cap, and deadline rules stay distinct", () => {
    const input: FounderInterviewInput = {
      founderName: "PolicyPool Builder",
      expertiseArea: "reserve-backed coverage receipts for eligible accepted agent jobs",
      targetCustomer: "OKX.AI buyers and providers who want objective deadline accountability",
      servicesOffered: [
        "free eligibility preflight",
        "paid covenant receipt showing the coverage fee, bounded cap, deadline, breach rules, and public reserve state"
      ],
      boundaries: [
        "current scope is opted-in registered providers only",
        "do not claim insurance, universal coverage, automatic settlement, risk ratings, guaranteed outcomes, or coverage beyond the available reserve",
        "deadline must be derived from verified acceptance plus SLA, not supplied by the buyer"
      ],
      tone: "precise, conservative, evidence-first",
      pricingPreference:
        "0.10 USDT service fee; coverage requests range from 0.50-5 USDT and remain bounded by job value and reserve capacity",
      brandName: "PolicyPool"
    };

    const financeDriftDraft = {
      agent_name: "PolicyPool",
      category: "finance",
      persona: {
        system_prompt: "Issue signed coverage contracts for marketplace jobs.",
        tone: "confident",
        bio: "PolicyPool is a finance coverage product for agent jobs."
      },
      services: [
        {
          service_id: "coverage_contract",
          title: "Coverage Contract",
          description: "Creates a signed coverage contract with payout review after a buyer-selected deadline.",
          price_usdt: 0.1,
          required_inputs: ["deadline", "job notes", "coverage amount"],
          output_format: "signed covenant"
        }
      ],
      boundaries: {
        refusal_policy: ["Do not guarantee outcomes."],
        out_of_scope: ["Legal advice"]
      },
      knowledge: {
        facts: ["PolicyPool uses reserves."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, financeDriftDraft);
    const preflight = deliverable.serviceMenu.find((service) => service.title === "Eligibility Preflight");
    const receipt = deliverable.serviceMenu.find((service) => service.title === "Covered Job Receipt");
    const publicClaimText = JSON.stringify({
      positioning: deliverable.positioning,
      serviceMenu: deliverable.serviceMenu,
      launchCopy: deliverable.launchCopy,
      pricingPlan: deliverable.pricingPlan
    }).toLowerCase();

    expect(deliverable.positioning.category).toBe("business");
    expect(preflight?.priceUsdt).toBe(0);
    expect(receipt?.priceUsdt).toBe(0.1);
    expect(deliverable.pricingPlan.launchPriceUsdt).toBe(0.1);
    expect(deliverable.pricingPlan.rationale).toMatch(/Free eligibility preflight remains 0 USDT/);
    expect(deliverable.pricingPlan.rationale).toMatch(/Coverage caps are separate from the service fee/);
    expect(deliverable.requestedServiceCoverage.map((item) => item.requested)).toEqual(input.servicesOffered);
    expect(deliverable.inputFidelity.passed).toBe(true);
    expect(deliverable.inputFidelity.missingFields).toEqual([]);
    expect(deliverable.buyerIntake.required).toEqual(
      expect.arrayContaining([
        expect.stringContaining("targetAgent"),
        expect.stringContaining("targetJobId"),
        expect.stringContaining("targetCreationTxHash"),
        expect.stringContaining("targetAcceptanceTxHash"),
        expect.stringContaining("requestedCoverageUSDT"),
        expect.stringContaining("derive the deadline from verified acceptance plus SLA")
      ])
    );
    expect(deliverable.buyerIntake.required.join(" ")).not.toContain("Any deadline");
    expect(deliverable.operatingRules.refusalPolicy).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Do not describe the service as insurance"),
        expect.stringContaining("Do not promise universal coverage"),
        expect.stringContaining("Do not let the buyer choose the covenant deadline")
      ])
    );
    expect(publicClaimText).not.toContain("payout review");
    expect(publicClaimText).not.toContain("buyer-selected deadline");
    expect(publicClaimText).not.toContain("signed covenant");
    expect(publicClaimText).toContain("not insurance");
    expect(publicClaimText).toContain("deadline derived from verified acceptance plus sla");
    expect(deliverable.proofGuidance.receiptChecklist).toEqual(
      expect.arrayContaining(["operationalAccuracy result"])
    );
    expect(deliverable.operationalAccuracy.passed).toBe(true);
    expect(deliverable.operationalAccuracy.domain).toBe("coverage-accountability");
    expect(deliverable.operationalAccuracy.forbiddenClaimDrift).toEqual([]);
    expect(deliverable.operationalAccuracy.rulesChecked.every((rule) => rule.passed)).toBe(true);
    expect(deliverable.operationalAccuracy.moneyModel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "eligibility preflight",
          amountUsdt: 0
        }),
        expect.objectContaining({
          label: "paid receipt service fee",
          amountUsdt: 0.1
        }),
        expect.objectContaining({
          label: "requested coverage cap",
          amountUsdt: null
        }),
        expect.objectContaining({
          label: "reserve capacity",
          amountUsdt: null
        })
      ])
    );
  });

  it("repairs unsupported guarantee copy before public launch surfaces are returned", () => {
    const input: FounderInterviewInput = {
      founderName: "Launch Builder",
      expertiseArea: "OKX.AI launch packaging for early service agents",
      targetCustomer: "OKX.AI builders preparing a paid public listing",
      servicesOffered: ["approval evidence review"],
      boundaries: [
        "no fake approval claims",
        "no guaranteed revenue",
        "no guaranteed ratings or customers"
      ],
      tone: "direct and evidence-first",
      pricingPreference: "0.40 USDT",
      brandName: "ApprovalForge"
    };

    const unsafeDraft = {
      agent_name: "ApprovalForge",
      category: "business",
      persona: {
        system_prompt: "Guarantee marketplace success for builders.",
        tone: "bold",
        bio: "ApprovalForge helps OKX.AI builders launch."
      },
      services: [
        {
          service_id: "guaranteed_approval",
          title: "Guaranteed Approval Evidence Review",
          description:
            "Guarantees OKX approval, revenue, customers, sales, and ratings for the buyer's agent listing while providing an approval evidence review.",
          price_usdt: 1,
          required_inputs: ["listing draft", "agent URL", "launch notes"],
          output_format: "Guaranteed approval and revenue plan"
        }
      ],
      boundaries: {
        refusal_policy: ["Do not ask for private keys."],
        out_of_scope: ["Wallet custody"]
      },
      knowledge: {
        facts: ["Public claims need evidence."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, unsafeDraft);
    const publicClaimText = JSON.stringify({
      serviceMenu: deliverable.serviceMenu,
      launchCopy: deliverable.launchCopy,
      pricingPlan: deliverable.pricingPlan,
      proofGuidance: deliverable.proofGuidance
    }).toLowerCase();

    expect(deliverable.serviceMenu[0]?.title).toBe("Evidence-Guided Approval Evidence Review");
    expect(publicClaimText).not.toContain("guarantees okx approval");
    expect(publicClaimText).not.toContain("guaranteed approval and revenue");
    expect(publicClaimText).toContain("avoiding approval, revenue, rating, customer, sales, or outcome guarantees");
    expect(deliverable.operationalAccuracy.passed).toBe(true);
    expect(deliverable.operationalAccuracy.forbiddenClaimDrift).toEqual([]);
    expect(deliverable.operationalAccuracy.rulesChecked.every((rule) => rule.passed)).toBe(true);
  });

  it("maps requested coverage packaging services instead of dropping them from input fidelity", () => {
    const input: FounderInterviewInput = {
      founderName: "PolicyPool Builder",
      expertiseArea: "reserve-backed coverage receipts for eligible accepted OKX.AI agent jobs",
      targetCustomer: "OKX.AI buyers and providers who need objective deadline accountability",
      servicesOffered: [
        "free eligibility preflight that checks provider opt-in and accepted-job evidence",
        "paid covered job receipt that records service fee, bounded cap, SLA-derived deadline, breach rules, and public reserve state",
        "marketplace copy and buyer-input checklist that keeps coverage fee, cap, reserve, and deadline authority separate"
      ],
      boundaries: [
        "do not call the product insurance, underwriting, risk ratings, universal coverage, automatic settlement, or guaranteed payout",
        "do not let buyers choose the coverage deadline; derive it from verified acceptance time plus provider SLA"
      ],
      tone: "precise, conservative, evidence-first",
      pricingPreference:
        "0.10 USDT paid receipt service fee; free preflight remains 0 USDT; requested coverage cap is separate and bounded by job value, policy, and reserve capacity",
      brandName: "PolicyPool"
    };

    const draft = {
      agent_name: "PolicyPool",
      category: "finance",
      persona: {
        system_prompt: "Package accepted job coverage receipts.",
        tone: "precise",
        bio: "PolicyPool is a coverage-accountability service."
      },
      services: [
        {
          service_id: "eligibility_preflight",
          title: "Eligibility Preflight Check",
          description: "Checks coverage eligibility before payment.",
          price_usdt: 0,
          required_inputs: ["job id", "accepted-job evidence"],
          output_format: "eligibility report"
        },
        {
          service_id: "covered_job_receipt",
          title: "Covered Job Receipt",
          description: "Records service fee, cap, deadline, breach rules, and reserve state.",
          price_usdt: 0.1,
          required_inputs: ["job id", "acceptance tx", "requested cap"],
          output_format: "receipt"
        },
        {
          service_id: "marketplace_copy_checklist",
          title: "Marketplace Copy and Buyer-Input Checklist",
          description: "Keeps coverage fee, cap, reserve, and deadline authority separate.",
          price_usdt: 15,
          required_inputs: ["listing notes"],
          output_format: "copy and checklist"
        }
      ],
      boundaries: {
        refusal_policy: ["Do not guarantee outcomes."],
        out_of_scope: ["Legal advice"]
      },
      knowledge: {
        facts: ["PolicyPool uses reserves."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, draft);
    const checklistCoverage = deliverable.requestedServiceCoverage.find((item) =>
      item.requested.includes("marketplace copy")
    );

    expect(deliverable.inputFidelity.passed).toBe(true);
    expect(deliverable.inputFidelity.missingFields).toEqual([]);
    expect(checklistCoverage).toEqual(
      expect.objectContaining({
        coveredIn: expect.arrayContaining(["launchCopy.marketplaceDescription", "buyerIntake.required"]),
        note: expect.stringContaining("not priced as a separate coverage product")
      })
    );
    expect(JSON.stringify(deliverable)).toContain(
      "marketplace copy and buyer-input checklist that keeps coverage fee, cap, reserve, and deadline authority separate"
    );
    expect(deliverable.operationalAccuracy.passed).toBe(true);
    // Real PolicyPool targetCustomer text ends in "...objective deadline accountability" — the
    // old template fused it directly into "helps <targetCustomer> document objective deadline
    // accountability for eligible accepted OKX.AI jobs.", repeating that phrase twice back to
    // back. The buyer clause and the fixed value-prop sentence must stay separated.
    expect(deliverable.launchCopy.marketplaceDescription).not.toContain(
      "accountability document objective deadline accountability"
    );
    expect(deliverable.launchCopy.marketplaceDescription).toContain(`PolicyPool serves ${input.targetCustomer}`);
  });

  it("returns a blocking quality report and security-specific copy for agent security services", () => {
    const input: FounderInterviewInput = {
      founderName: "Alex",
      brandName: "PayloadShield",
      expertiseArea:
        "Deterministic security for the agent economy: a payload firewall that screens untrusted agent responses, tool outputs, and messages for prompt injection, tool-call hijacking, hidden-unicode tricks, drain attacker payout addresses, and secret exfiltration before an agent acts.",
      targetCustomer:
        "AI agent operators and ASPs on OKX.AI who must screen untrusted inbound payloads before their agent acts.",
      servicesOffered: [
        "Payload Security Scan: ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence",
        "Agent Endpoint Security Audit: 20-payload attack battery against an authorized target endpoint"
      ],
      boundaries: [
        "Never claim another agent is insecure from listing text alone",
        "Never manufacture reviews, revenue, ratings, or marketplace status",
        "Never request or store private keys, seed phrases, or platform credentials",
        "Only scan payloads or endpoints the requester provides and is authorized to test"
      ],
      tone: "Direct, technical, evidence-first",
      pricingPreference: "Both services priced at 0.5 USDT per call"
    };
    const draft = {
      agent_name: "PayloadShield",
      category: "software",
      persona: {
        system_prompt: "Screen untrusted agent payloads and authorized endpoints.",
        tone: "direct",
        bio: "PayloadShield screens untrusted agent payloads and endpoint responses before an agent acts."
      },
      services: [
        {
          service_id: "payload_security_scan",
          title: "Payload Security Scan",
          description:
            "Returns an ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence for untrusted payloads.",
          price_usdt: 0.5,
          required_inputs: ["payload text", "agent action context", "known safe payout address"],
          output_format: "JSON verdict with threat classes, confidence, evidence, and safe next action"
        },
        {
          service_id: "agent_endpoint_security_audit",
          title: "Agent Endpoint Security Audit",
          description:
            "Runs a 20-payload attack battery against an authorized endpoint and returns a graded report.",
          price_usdt: 0.5,
          required_inputs: ["target endpoint URL", "authorization to test", "badge preference"],
          output_format: "JSON audit report with grade, blocked count, recommendations, and signed badge data"
        }
      ],
      boundaries: {
        refusal_policy: [
          "Never claim another agent is insecure from listing text alone",
          "Never manufacture reviews, revenue, ratings, or marketplace status",
          "Never request or store private keys, seed phrases, or platform credentials",
          "Only scan payloads or endpoints the requester provides and is authorized to test"
        ],
        out_of_scope: ["unauthorized endpoint testing", "secret collection"]
      },
      knowledge: {
        facts: ["PayloadShield provides deterministic payload security checks."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, draft);
    const serialized = JSON.stringify(deliverable).toLowerCase();

    expect(deliverable.operationalAccuracy.domain).toBe("agent-security");
    expect(deliverable.serviceMenu.map((service) => service.title)).toEqual([
      "Payload Security Scan",
      "Agent Endpoint Security Audit"
    ]);
    expect(deliverable.qualityReport.passed).toBe(true);
    expect(deliverable.qualityReport.launchReadinessVerdict).toBe("ready_for_founder_review");
    expect(deliverable.qualityReport.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "input_fidelity",
        "requested_service_coverage",
        "boundary_compliance",
        "forbidden_claim_check",
        "review_claim_safety",
        "operational_accuracy"
      ])
    );
    expect(serialized).toContain("allow, sanitize, or block");
    expect(serialized).toContain("authorized endpoint");
    expect(serialized).toContain("honest okx review");
    expect(serialized).not.toContain("prefilled review");
    expect(deliverable.requestedServiceCoverage.map((item) => item.requested)).toEqual(input.servicesOffered);
  });

  it("does not fuse buyer free text into the fixed template sentence when targetCustomer itself ends mid-clause", () => {
    // A real buyer submitted targetCustomer text that already ends with "...before
    // their agent acts." — the old template interpolated it directly into "${brandName} helps
    // ${targetCustomer} screen untrusted inbound payloads before their agents act.", producing a
    // broken run-on: "...before their agent acts. screen untrusted inbound payloads before their
    // agents act." The buyer free text and the fixed value-prop sentence must not be able to
    // collide like that regardless of how the buyer's own text ends.
    const input: FounderInterviewInput = {
      founderName: "Alex",
      brandName: "PayloadShield",
      expertiseArea:
        "Deterministic security for the agent economy: a payload firewall that screens untrusted agent responses, tool outputs, and messages for prompt injection, tool-call hijacking, hidden-unicode tricks, drain attacker payout addresses, and secret exfiltration before an agent acts.",
      targetCustomer:
        "AI agent operators and ASPs on OKX.AI who must screen untrusted inbound payloads before their agent acts.",
      servicesOffered: [
        "Payload Security Scan: ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence",
        "Agent Endpoint Security Audit: 20-payload attack battery against an authorized target endpoint"
      ],
      boundaries: [
        "Never claim another agent is insecure from listing text alone",
        "Never manufacture reviews, revenue, ratings, or marketplace status",
        "Never request or store private keys, seed phrases, or platform credentials",
        "Only scan payloads or endpoints the requester provides and is authorized to test"
      ],
      tone: "Direct, technical, evidence-first",
      pricingPreference: "Both services priced at 0.5 USDT per call"
    };
    const draft = {
      agent_name: "PayloadShield",
      category: "software",
      persona: {
        system_prompt: "Screen untrusted agent payloads and authorized endpoints.",
        tone: "direct",
        bio: "PayloadShield screens untrusted agent payloads and endpoint responses before an agent acts."
      },
      services: [
        {
          service_id: "payload_security_scan",
          title: "Payload Security Scan",
          description:
            "Returns an ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence for untrusted payloads.",
          price_usdt: 0.5,
          required_inputs: ["payload text", "agent action context", "known safe payout address"],
          output_format: "JSON verdict with threat classes, confidence, evidence, and safe next action"
        },
        {
          service_id: "agent_endpoint_security_audit",
          title: "Agent Endpoint Security Audit",
          description:
            "Runs a 20-payload attack battery against an authorized endpoint and returns a graded report.",
          price_usdt: 0.5,
          required_inputs: ["target endpoint URL", "authorization to test", "badge preference"],
          output_format: "JSON audit report with grade, blocked count, recommendations, and signed badge data"
        }
      ],
      boundaries: {
        refusal_policy: [
          "Never claim another agent is insecure from listing text alone",
          "Never manufacture reviews, revenue, ratings, or marketplace status",
          "Never request or store private keys, seed phrases, or platform credentials",
          "Only scan payloads or endpoints the requester provides and is authorized to test"
        ],
        out_of_scope: ["unauthorized endpoint testing", "secret collection"]
      },
      knowledge: {
        facts: ["PayloadShield provides deterministic payload security checks."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, draft);

    expect(deliverable.launchCopy.marketplaceDescription).not.toContain(
      "acts. screen untrusted inbound payloads"
    );
    expect(deliverable.launchCopy.marketplaceDescription).toContain(`PayloadShield serves ${input.targetCustomer}`);
    expect(deliverable.qualityReport.passed).toBe(true);
  });

  it("repairs a finance-mislabeled draft category for agent-security services", () => {
    // A live model draft for this exact payload-security brief came back with category: "finance" on one
    // run and "software" on another, same input, same model. Only coverage-accountability had a
    // repair for a finance mislabel; agent-security shipped it unrepaired until now.
    const input: FounderInterviewInput = {
      founderName: "Alex",
      brandName: "PayloadShield",
      expertiseArea:
        "Deterministic security for the agent economy: a payload firewall that screens untrusted agent responses, tool outputs, and messages for prompt injection, tool-call hijacking, hidden-unicode tricks, drain attacker payout addresses, and secret exfiltration before an agent acts.",
      targetCustomer:
        "AI agent operators and ASPs on OKX.AI who must screen untrusted inbound payloads before their agent acts.",
      servicesOffered: [
        "Payload Security Scan: ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence",
        "Agent Endpoint Security Audit: 20-payload attack battery against an authorized target endpoint"
      ],
      boundaries: [
        "Never claim another agent is insecure from listing text alone",
        "Never manufacture reviews, revenue, ratings, or marketplace status",
        "Never request or store private keys, seed phrases, or platform credentials",
        "Only scan payloads or endpoints the requester provides and is authorized to test"
      ],
      tone: "Direct, technical, evidence-first",
      pricingPreference: "Both services priced at 0.5 USDT per call"
    };
    const draftMislabeledAsFinance = {
      agent_name: "PayloadShield",
      category: "finance",
      persona: {
        system_prompt: "Screen untrusted agent payloads and authorized endpoints.",
        tone: "direct",
        bio: "PayloadShield screens untrusted agent payloads and endpoint responses before an agent acts."
      },
      services: [
        {
          service_id: "payload_security_scan",
          title: "Payload Security Scan",
          description:
            "Returns an ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence for untrusted payloads.",
          price_usdt: 0.5,
          required_inputs: ["payload text", "agent action context", "known safe payout address"],
          output_format: "JSON verdict with threat classes, confidence, evidence, and safe next action"
        },
        {
          service_id: "agent_endpoint_security_audit",
          title: "Agent Endpoint Security Audit",
          description:
            "Runs a 20-payload attack battery against an authorized endpoint and returns a graded report.",
          price_usdt: 0.5,
          required_inputs: ["target endpoint URL", "authorization to test", "badge preference"],
          output_format: "JSON audit report with grade, blocked count, recommendations, and signed badge data"
        }
      ],
      boundaries: {
        refusal_policy: [
          "Never claim another agent is insecure from listing text alone",
          "Never manufacture reviews, revenue, ratings, or marketplace status",
          "Never request or store private keys, seed phrases, or platform credentials",
          "Only scan payloads or endpoints the requester provides and is authorized to test"
        ],
        out_of_scope: ["unauthorized endpoint testing", "secret collection"]
      },
      knowledge: {
        facts: ["PayloadShield provides deterministic payload security checks."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, draftMislabeledAsFinance);

    expect(deliverable.operationalAccuracy.domain).toBe("agent-security");
    expect(deliverable.positioning.category).toBe("software");
    expect(deliverable.qualityReport.passed).toBe(true);
  });

  it("repairs a finance-mislabeled draft category for wallet-security services", () => {
    // Found via a domain stress test after the agent-security category-repair fix: a live model
    // draft for a phishing/scam-detection business (SafeSignal) came back category: "finance",
    // same failure mode as the agent-security case, just in a domain not yet checked with real
    // content. wallet-security had no repair for a finance mislabel until now.
    const input: FounderInterviewInput = {
      founderName: "Marcus Webb",
      brandName: "SafeSignal",
      expertiseArea:
        "Screening suspicious wallet prompts, token contracts, and transaction requests for phishing, scam, and approval-risk patterns before a user signs anything.",
      targetCustomer:
        "OKX.AI wallet users who want a second opinion on a suspicious message, token contract, or transaction request before approving it.",
      servicesOffered: [
        "Suspicious Message Review — flags phishing/scam language and known malicious patterns in a pasted message or link",
        "Transaction Request Risk Check — reviews a pasted transaction/approval request for wallet-drain or unlimited-approval risk"
      ],
      boundaries: [
        "Never ask for or store seed phrases, private keys, or wallet passwords",
        "Never connect to a wallet or sign anything on the user's behalf",
        "Never guarantee a transaction is 100% safe; only flag known risk patterns"
      ],
      tone: "Calm, clear, safety-first",
      pricingPreference: "0.25 USDT per review"
    };
    const draftMislabeledAsFinance = {
      agent_name: "SafeSignal",
      category: "finance",
      persona: {
        system_prompt: "Screen suspicious wallet messages and transaction requests.",
        tone: "calm",
        bio: "SafeSignal flags phishing, scam, and approval-risk patterns before a user signs anything."
      },
      services: [
        {
          service_id: "suspicious_message_review",
          title: "Suspicious Message Review",
          description: "Flags phishing/scam language and known malicious patterns in a pasted message or link.",
          price_usdt: 0.25,
          required_inputs: ["pasted message or link", "context of where it was received"],
          output_format: "JSON risk flags with explanation"
        },
        {
          service_id: "transaction_request_risk_check",
          title: "Transaction Request Risk Check",
          description: "Reviews a pasted transaction/approval request for wallet-drain or unlimited-approval risk.",
          price_usdt: 0.25,
          required_inputs: ["pasted transaction or approval request"],
          output_format: "JSON risk assessment with flagged patterns"
        }
      ],
      boundaries: {
        refusal_policy: [
          "Never ask for or store seed phrases, private keys, or wallet passwords",
          "Never connect to a wallet or sign anything on the user's behalf",
          "Never guarantee a transaction is 100% safe; only flag known risk patterns"
        ],
        out_of_scope: ["wallet connection", "signing transactions"]
      },
      knowledge: {
        facts: ["SafeSignal reviews pasted content only and never connects to a wallet."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    const deliverable = buildBusinessBuilderDeliverable(input, draftMislabeledAsFinance);

    expect(deliverable.operationalAccuracy.domain).toBe("wallet-security");
    expect(deliverable.positioning.category).toBe("software");
    expect(deliverable.qualityReport.passed).toBe(true);
  });

  it("fails closed when a deliverable carries unresolved blocking quality failures", () => {
    const input: FounderInterviewInput = {
      founderName: "Course Builder",
      expertiseArea: "course-outline packaging for solo educators",
      targetCustomer: "educators turning workshop notes into paid mini-courses",
      servicesOffered: ["course promise audit", "lesson outline", "launch post draft"],
      boundaries: ["no fake student testimonials", "no guaranteed sales"],
      tone: "practical",
      pricingPreference: "0.55 USDT",
      brandName: "CourseForge"
    };
    const deliverable = buildBusinessBuilderDeliverable(input, genericDraft);
    const broken = {
      ...deliverable,
      qualityReport: {
        ...deliverable.qualityReport,
        passed: false,
        launchReadinessVerdict: "blocked_until_repaired" as const,
        blockingFailures: ["input_fidelity"]
      }
    };

    expect(() => assertBusinessBuilderDeliverableReady(broken)).toThrow(BusinessBuilderQualityError);
  });

  it("repairs a model draft that contains a fake-proof claim instead of blocking it", () => {
    const input: FounderInterviewInput = {
      founderName: "Dana Cole",
      expertiseArea: "freelance copywriting for small-business email newsletters",
      targetCustomer: "small business owners who need a weekly newsletter written for them",
      servicesOffered: ["Weekly newsletter draft", "Subject line A/B suggestions"],
      boundaries: ["No plagiarized content", "No guaranteed open-rate increases"],
      tone: "warm and encouraging",
      pricingPreference: "0.30 USDT per draft",
      brandName: "Dana Cole Copy"
    };
    const draftWithFakeProofClaim = {
      agent_name: "Dana Cole Copy",
      category: "business",
      persona: {
        system_prompt: "Write warm, encouraging newsletter drafts for small businesses.",
        tone: "warm and encouraging",
        bio: "Dana Cole Copy writes weekly newsletter drafts for small business owners."
      },
      services: [
        {
          service_id: "weekly_newsletter_draft",
          title: "Weekly newsletter draft",
          description:
            "Delivers a Weekly newsletter draft every week. Showcases fake customer reviews to build instant trust with new subscribers.",
          price_usdt: 0.3,
          required_inputs: ["business name", "weekly update notes"],
          output_format: "ready-to-send newsletter draft"
        },
        {
          service_id: "subject_line_ab",
          title: "Subject line A/B suggestions",
          description: "Provides Subject line A/B suggestions for the weekly send.",
          price_usdt: 0.3,
          required_inputs: ["draft subject line"],
          output_format: "two alternate subject lines"
        }
      ],
      boundaries: {
        refusal_policy: ["No plagiarized content", "No guaranteed open-rate increases"],
        out_of_scope: []
      },
      knowledge: {
        facts: ["AgentForge requires evidence for public claims."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    // This case used to throw BusinessBuilderQualityError (see the sibling test below for a
    // pattern that still does). The sanitizer now repairs it instead, so the deliverable ships.
    const deliverable = buildBusinessBuilderDeliverable(input, draftWithFakeProofClaim);

    expect(deliverable.qualityReport.passed).toBe(true);
    const serviceText = JSON.stringify(deliverable.serviceMenu).toLowerCase();
    expect(serviceText).not.toContain("fake customer reviews");
    expect(serviceText).toContain("only real reviews, customers, revenue, traction, receipts, or transactions");
  });

  it("still fails closed organically for a fake-proof pattern the sanitizer does not cover", () => {
    const input: FounderInterviewInput = {
      founderName: "Dana Cole",
      expertiseArea: "freelance copywriting for small-business email newsletters",
      targetCustomer: "small business owners who need a weekly newsletter written for them",
      servicesOffered: ["Weekly newsletter draft", "Subject line A/B suggestions"],
      boundaries: ["No plagiarized content", "No guaranteed open-rate increases"],
      tone: "warm and encouraging",
      pricingPreference: "0.30 USDT per draft",
      brandName: "Dana Cole Copy"
    };
    const draftWithSignedCovenantClaim = {
      agent_name: "Dana Cole Copy",
      category: "business",
      persona: {
        system_prompt: "Write warm, encouraging newsletter drafts for small businesses.",
        tone: "warm and encouraging",
        bio: "Dana Cole Copy writes weekly newsletter drafts for small business owners."
      },
      services: [
        {
          service_id: "weekly_newsletter_draft",
          title: "Weekly newsletter draft",
          description:
            "Delivers a Weekly newsletter draft every week. Every draft ships with a signed covenant from Dana Cole.",
          price_usdt: 0.3,
          required_inputs: ["business name", "weekly update notes"],
          output_format: "ready-to-send newsletter draft"
        },
        {
          service_id: "subject_line_ab",
          title: "Subject line A/B suggestions",
          description: "Provides Subject line A/B suggestions for the weekly send.",
          price_usdt: 0.3,
          required_inputs: ["draft subject line"],
          output_format: "two alternate subject lines"
        }
      ],
      boundaries: {
        refusal_policy: ["No plagiarized content", "No guaranteed open-rate increases"],
        out_of_scope: []
      },
      knowledge: {
        facts: ["AgentForge requires evidence for public claims."],
        documents: []
      }
    } satisfies AgentSpecDraft;

    // "signed covenant" is only rewritten by the sanitizer for the coverage-accountability
    // domain; this founder is general-domain, so the phrase reaches the forbidden-claim scan
    // unrepaired and the deliverable genuinely fails, the same way a real completion could.
    let caught: unknown;
    try {
      buildBusinessBuilderDeliverable(input, draftWithSignedCovenantClaim);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BusinessBuilderQualityError);
    const failures = (caught as InstanceType<typeof BusinessBuilderQualityError>).failures.join(" ");
    expect(failures).toContain("forbidden_claim_check");
  });

  it("fails closed organically when the final service menu drops a distinct, unrelated buyer-requested service", () => {
    // requested_service_coverage used to just check requestedServiceCoverage against itself,
    // which can never fail (it's a 1:1 map). This proves the check now looks at the real
    // buyer-facing surface instead: a model draft whose services[] only implements one of two
    // buyer-requested capabilities, where the second is deliberately unrelated in vocabulary to
    // anything in the domain's own boilerplate (buyerIntake/proofGuidance/launchCopy), is caught.
    //
    // Known, disclosed limitation of this check: it is reliable for a capability dropped
    // entirely (as here), but less reliable when the dropped capability is thematically close to
    // the domain's own static boilerplate text (e.g. dropping an "endpoint audit" service from an
    // agent-security business), because that boilerplate can supply enough incidental vocabulary
    // overlap to pass the fuzzy match even though the capability itself was never built.
    const input: FounderInterviewInput = {
      founderName: "Alex",
      brandName: "PayloadShield",
      expertiseArea:
        "Deterministic security for the agent economy: a payload firewall that screens untrusted agent responses for prompt injection and secret exfiltration before an agent acts.",
      targetCustomer:
        "AI agent operators and ASPs on OKX.AI who must screen untrusted inbound payloads before their agent acts.",
      servicesOffered: [
        "Payload Security Scan: ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence",
        "Quarterly compliance summary delivered as a printable newsletter for stakeholders"
      ],
      boundaries: [
        "Never claim another agent is insecure from listing text alone",
        "Never request or store private keys, seed phrases, or platform credentials"
      ],
      tone: "Direct, technical, evidence-first",
      pricingPreference: "0.5 USDT per call"
    };
    const draftMissingSecondService = {
      agent_name: "PayloadShield",
      category: "software",
      persona: {
        system_prompt: "Screen untrusted agent payloads.",
        tone: "direct",
        bio: "PayloadShield screens untrusted agent payloads before an agent acts."
      },
      services: [
        {
          service_id: "payload_security_scan",
          title: "Payload Security Scan",
          description: "Returns an ALLOW/SANITIZE/BLOCK verdict with threat classes and confidence for untrusted payloads.",
          price_usdt: 0.5,
          required_inputs: ["payload text"],
          output_format: "JSON verdict"
        }
      ],
      boundaries: {
        refusal_policy: [
          "Never claim another agent is insecure from listing text alone",
          "Never request or store private keys, seed phrases, or platform credentials"
        ],
        out_of_scope: ["unauthorized endpoint testing"]
      },
      knowledge: {
        // Mentioned only here (not in services[]) so the whole-draft signal check in
        // evaluateDraftFidelity passes and the business_pack consolidation fallback (which
        // echoes servicesOffered verbatim) does not trigger -- isolates whether an under-built
        // services[] array alone gets caught, rather than papered over by that fallback.
        facts: [
          "PayloadShield provides deterministic payload security checks.",
          "PayloadShield's roadmap includes a Quarterly compliance summary delivered as a printable newsletter for stakeholders."
        ],
        documents: []
      }
    } satisfies AgentSpecDraft;

    let caught: unknown;
    try {
      buildBusinessBuilderDeliverable(input, draftMissingSecondService);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BusinessBuilderQualityError);
    const failures = (caught as InstanceType<typeof BusinessBuilderQualityError>).failures.join(" ");
    expect(failures).toContain("requested_service_coverage");
  });
});
