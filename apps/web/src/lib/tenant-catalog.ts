export type TenantStatus = "gated" | "heartbeat" | "softlaunch" | "public";

export type TenantCatalogEntry = {
  slug: string;
  agentId: string;
  founderName?: string;
  agentName: string;
  category: "business" | "software" | "education" | "finance" | "lifestyle" | "art";
  status: TenantStatus;
  route: `/svc/${string}`;
  mcpRoute: `/mcp/${string}`;
  displayAmount: string;
  service: {
    title: string;
    description: string;
    requiredInputs: string[];
    outputFormat: string;
  };
  persona: {
    summary: string;
  };
  refusalBoundaries: string[];
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
  };
};

const tenants = [
  {
    slug: "forge",
    agentId: "agentforge-3746",
    agentName: "AgentForge",
    category: "business",
    status: "public",
    route: "/svc/forge",
    mcpRoute: "/mcp/forge",
    displayAmount: "0.40 USDT",
    service: {
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
      summary: "AgentForge packages real human expertise into verified, revenue-ready ASP services."
    },
    refusalBoundaries: [
      "Do not invent founder credentials.",
      "Do not publish or imply fake revenue, ratings, founders, or marketplace status.",
      "Do not request private keys, seed phrases, or secret platform credentials."
    ],
    proof: {
      forgeGateReportId: "fg_live_b80393ebdc97ebc2",
      forgeGateEvidenceRef: "ops/evidence/2026-07-13-t14-live-gate-production-runs.md",
      ownHeartbeatTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
      ownHeartbeatEvidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md",
      ownHeartbeatServiceCallId: "sc_forge_b8f8787c7c13"
    }
  },
  {
    slug: "shieldcheck",
    agentId: "agentforge-shieldcheck-01",
    founderName: "Abiola Apata",
    agentName: "ShieldCheck",
    category: "software",
    status: "softlaunch",
    route: "/svc/shieldcheck",
    mcpRoute: "/mcp/shieldcheck",
    displayAmount: "0.40 USDT",
    service: {
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
    agentName: "Launch Kit",
    category: "business",
    status: "heartbeat",
    route: "/svc/launch-kit",
    mcpRoute: "/mcp/launch-kit",
    displayAmount: "0.45 USDT",
    service: {
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
      summary: "Launch Kit helps OKX.AI builders avoid listing/review mistakes without exposing AgentForge internals."
    },
    refusalBoundaries: [
      "Do not guarantee OKX approval.",
      "Do not reveal private AgentForge operating mechanics.",
      "Do not advise users to submit unreachable, fake, or mismatched services."
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

export function listStorefrontTenants(): TenantCatalogEntry[] {
  return tenants.map(cloneTenant);
}

export function findStorefrontTenant(slug: string): TenantCatalogEntry | null {
  const tenant = tenants.find((entry) => entry.slug === slug);
  return tenant ? cloneTenant(tenant) : null;
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
    ...(tenant.proof ? { proof: { ...tenant.proof } } : {})
  };
}
