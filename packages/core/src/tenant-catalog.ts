import { assertStatusTransition, type StatusTransitionSubject } from "./status-machine.js";

export type TenantKind = "business-builder" | "launch-kit" | "security-review";

export type TenantStatus = "gated" | "heartbeat" | "softlaunch" | "public";

export type TenantCategory = "business" | "software" | "education" | "finance" | "lifestyle" | "art";

export type TenantCatalogEntry = {
  slug: string;
  agentId: string;
  founderId: string;
  founderName?: string;
  agentName: string;
  category: TenantCategory;
  status: TenantStatus;
  kind: TenantKind;
  route: `/svc/${string}`;
  mcpRoute: `/mcp/${string}`;
  priceUsd: string;
  displayAmount: string;
  service: {
    serviceId: string;
    title: string;
    description: string;
    requiredInputs: string[];
    outputFormat: string;
  };
  persona: {
    tone: string;
    summary: string;
  };
  refusalBoundaries: string[];
  knowledgeFacts: string[];
  proof?: {
    forgeGateReportId?: string;
    forgeGateEvidenceRef?: string;
    forgeGenesisTx?: `0x${string}`;
    forgeGenesisEvidenceRef?: string;
    consentEvidenceRef?: string;
    birthCertificateId?: string;
    birthCertificateAnchorTx?: `0x${string}`;
    ownHeartbeatTx?: `0x${string}`;
    ownHeartbeatEvidenceRef?: string;
    ownHeartbeatServiceCallId?: string;
    publicListingEvidenceRef?: string;
  };
};

const tenantCatalog = [
  {
    slug: "forge",
    agentId: "agentforge-3746",
    founderId: "agentforge-core",
    agentName: "AgentForge",
    category: "business",
    status: "public",
    kind: "business-builder",
    route: "/svc/forge",
    mcpRoute: "/mcp/forge",
    priceUsd: "$0.40",
    displayAmount: "0.40 USDT",
    service: {
      serviceId: "ai-agent-business-builder",
      title: "AI Agent Business Builder",
      description: "Turns founder expertise into a priced AI service package with buyer inputs and launch copy.",
      requiredInputs: [
        "Founder name",
        "Expertise area",
        "Target customer",
        "Services offered",
        "Boundaries",
        "Tone",
        "Pricing preference"
      ],
      outputFormat: "Agent business package with service menu, rules, receipt-ready metadata, and launch copy"
    },
    persona: {
      tone: "direct, practical, and evidence-first",
      summary: "AgentForge packages real human expertise into verified, revenue-ready ASP services."
    },
    refusalBoundaries: [
      "Do not invent founder credentials.",
      "Do not publish or imply fake revenue, ratings, founders, or marketplace status.",
      "Do not request private keys, seed phrases, or secret platform credentials."
    ],
    knowledgeFacts: [
      "AgentForge #3746 is a live OKX.AI ASP listing.",
      "The primary rail is direct x402 / A2MCP pay-per-call.",
      "Founder-facing claims must be backed by real receipts, reviews, or listing evidence."
    ],
    proof: {
      forgeGateReportId: "fg_live_b80393ebdc97ebc2",
      forgeGateEvidenceRef: "ops/evidence/2026-07-13-t14-live-gate-production-runs.md",
      ownHeartbeatTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
      ownHeartbeatEvidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md",
      ownHeartbeatServiceCallId: "sc_forge_b8f8787c7c13",
      publicListingEvidenceRef: "ops/decisions.md#post-listing-reality-2026-07-06"
    }
  },
  {
    slug: "shieldcheck",
    agentId: "agentforge-shieldcheck-01",
    founderId: "founder-abiola-apata",
    founderName: "Abiola Apata",
    agentName: "ShieldCheck",
    category: "software",
    status: "softlaunch",
    kind: "security-review",
    route: "/svc/shieldcheck",
    mcpRoute: "/mcp/shieldcheck",
    priceUsd: "$0.40",
    displayAmount: "0.40 USDT",
    service: {
      serviceId: "phishing_scam_review",
      title: "Phishing & Scam Review",
      description:
        "Reviews a suspicious website, message, airdrop claim, or transaction request for scam indicators and safe next steps.",
      requiredInputs: [
        "Suspicious URL, message text, screenshot description, or transaction request details",
        "How the user received it",
        "Whether the user has already clicked, signed, connected, or otherwise interacted"
      ],
      outputFormat: "Scam risk assessment with red flags, verdict, and recommended next steps"
    },
    persona: {
      tone: "professional, calm, and reassuring",
      summary:
        "ShieldCheck helps crypto holders and small Web3 teams spot wallet, approval, and phishing risks without ever asking for secrets."
    },
    refusalBoundaries: [
      "Do not give financial advice, token recommendations, price predictions, or trading guidance.",
      "Do not attempt or promise recovery of stolen funds.",
      "Do not request or accept seed phrases, private keys, or secret credentials.",
      "Do not assist with offensive hacking or targeting other wallets or systems.",
      "Do not guarantee that a wallet, contract, approval, or platform is completely safe."
    ],
    knowledgeFacts: [
      "ShieldCheck is built from the cybersecurity expertise of founder Abiola Apata.",
      "The agent's focus areas are wallet security, token approval risk, phishing review, and safe-wallet practices.",
      "The Founder #1 package was born from a real 1 USDT paid call to AgentForge's forge service.",
      "ShieldCheck passed its live Forge Gate and completed one real paid heartbeat to its own service.",
      "Security reviews use public information and user-provided descriptions only, never seed phrases or private keys."
    ],
    proof: {
      forgeGateReportId: "fg_live_bcba01f18229cbbd",
      forgeGateEvidenceRef: "ops/evidence/2026-07-14-shieldcheck-forge-gate-live-pass.md",
      forgeGenesisTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
      forgeGenesisEvidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md",
      consentEvidenceRef: "ops/evidence/2026-07-13-t23-founder-one-activation.md",
      birthCertificateId: "bc_shieldcheck_2026-07-13",
      birthCertificateAnchorTx: "0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a",
      ownHeartbeatTx: "0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5",
      ownHeartbeatEvidenceRef: "ops/evidence/2026-07-14-shieldcheck-heartbeat.md",
      ownHeartbeatServiceCallId: "sc_shieldcheck_642e7372000a"
    }
  },
  {
    slug: "launch-kit",
    agentId: "agentforge-launch-kit",
    founderId: "agentforge-core",
    agentName: "Launch Kit",
    category: "business",
    status: "heartbeat",
    kind: "launch-kit",
    route: "/svc/launch-kit",
    mcpRoute: "/mcp/launch-kit",
    priceUsd: "$0.45",
    displayAmount: "0.45 USDT",
    service: {
      serviceId: "okxai-launch-kit",
      title: "OKX.AI Launch Kit",
      description: "Reviews an ASP launch package for listing clarity, comm-readiness, delisting risk, and evidence gaps.",
      requiredInputs: [
        "ASP/service draft copy",
        "Endpoint or delivery path description",
        "Current listing/review status",
        "Known blocker or reviewer feedback",
        "Proof assets already collected"
      ],
      outputFormat: "Launch-readiness report with pass/fail checks, delisting-recovery steps, and proof-bundle checklist"
    },
    persona: {
      tone: "plain-spoken, careful, and review-focused",
      summary: "Launch Kit helps OKX.AI builders avoid listing/review mistakes without exposing AgentForge internals."
    },
    refusalBoundaries: [
      "Do not guarantee OKX approval.",
      "Do not reveal private AgentForge operating mechanics.",
      "Do not advise users to submit unreachable, fake, or mismatched services."
    ],
    knowledgeFacts: [
      "A2MCP endpoints must be public HTTPS endpoints and x402-capable before listing.",
      "A2A services must have an always-on communication responder before listing.",
      "ASPs cannot be deleted; low-quality names and descriptions become permanent records.",
      "Comm-readiness should run after every create, update, or activation.",
      "If a listing is delisted because reality does not match copy, repair the live service first, then narrow the listing copy to exactly what a reviewer can observe.",
      "Proof bundles should include listing status, reachable endpoint checks, paid-call receipts or readiness transcripts, and a concise repair narrative.",
      "Launch Kit passed the live Forge Gate and completed one real paid self-operated heartbeat on 2026-07-14; it is not an external founder or independent customer win.",
      "Launch Kit remains heartbeat-stage until a birth certificate or equivalent soft-launch transition proof is recorded."
    ],
    proof: {
      forgeGateReportId: "fg_live_feb7a059bc064c78",
      forgeGateEvidenceRef: "ops/evidence/2026-07-14-launch-kit-forge-gate-live-pass.md",
      ownHeartbeatTx: "0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a",
      ownHeartbeatEvidenceRef: "ops/evidence/2026-07-14-launch-kit-heartbeat.md",
      ownHeartbeatServiceCallId: "sc_launch-kit_3b103d9976a5"
    }
  }
] satisfies TenantCatalogEntry[];

export function listTenantCatalog(): TenantCatalogEntry[] {
  assertTenantCatalogStatusEvidence();
  return tenantCatalog.map(cloneTenant);
}

export function findTenantCatalogEntry(slug: string): TenantCatalogEntry | null {
  assertTenantCatalogStatusEvidence();
  const tenant = tenantCatalog.find((entry) => entry.slug === slug);
  return tenant ? cloneTenant(tenant) : null;
}

export function assertTenantCatalogEntryStatusEvidence(tenant: TenantCatalogEntry) {
  const proof = tenant.proof;

  if (tenant.status === "public") {
    if (!proof?.publicListingEvidenceRef) {
      throw new Error(`${tenant.slug}: public status requires public listing evidence`);
    }
    return;
  }

  const gatedCandidate: StatusTransitionSubject = {
    status: "draft",
    forge_gate: {
      passed: Boolean(proof?.forgeGateReportId),
      score: proof?.forgeGateReportId ? 100 : 0,
      report_id: proof?.forgeGateReportId ?? null
    }
  };

  assertStatusTransition(gatedCandidate, "gated");

  if (tenant.status === "gated") {
    return;
  }

  const heartbeatCandidate: StatusTransitionSubject = {
    ...gatedCandidate,
    status: "gated"
  };

  assertStatusTransition(heartbeatCandidate, "heartbeat", {
    hasHeartbeatPaymentRef: Boolean(
      proof?.ownHeartbeatTx && proof.ownHeartbeatEvidenceRef && proof.ownHeartbeatServiceCallId
    )
  });

  if (tenant.status === "heartbeat") {
    return;
  }

  const softlaunchCandidate: StatusTransitionSubject = {
    ...gatedCandidate,
    status: "heartbeat"
  };

  assertStatusTransition(softlaunchCandidate, "softlaunch", {
    hasBirthCertificate: Boolean(proof?.birthCertificateId)
  });

  if (tenant.status === "softlaunch") {
    return;
  }
}

function assertTenantCatalogStatusEvidence() {
  for (const tenant of tenantCatalog) {
    assertTenantCatalogEntryStatusEvidence(tenant);
  }
}

function cloneTenant(tenant: TenantCatalogEntry): TenantCatalogEntry {
  return {
    ...tenant,
    service: {
      ...tenant.service,
      requiredInputs: [...tenant.service.requiredInputs]
    },
    persona: { ...tenant.persona },
    refusalBoundaries: [...tenant.refusalBoundaries],
    knowledgeFacts: [...tenant.knowledgeFacts],
    ...(tenant.proof ? { proof: { ...tenant.proof } } : {})
  };
}
