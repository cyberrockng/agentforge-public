import { getCrossTestingKit } from "./cross-testing";
import { findStorefrontTenant } from "./tenant-catalog";
import { findVerificationRecord } from "./verify-records";

export type LaunchDraft = {
  slug: string;
  agentName: string;
  founderName: string;
  status: "ready_for_founder_edit";
  postText: string;
  characterCount: number;
  profileHref: string;
  proofLinks: Array<{
    label: string;
    href: string;
    recordId: string;
  }>;
  editChecklist: string[];
  mustNotClaim: string[];
};

export type LaunchEngine = {
  title: string;
  humanPublishRequired: true;
  reviewCount: number;
  globalRules: string[];
  drafts: LaunchDraft[];
};

const webOrigin =
  process.env.NEXT_PUBLIC_AGENTFORGE_WEB_URL ?? "https://web-one-peach-2vp0hv3dr1.vercel.app";

const draftPlans = [
  {
    slug: "forge",
    evidenceRecordIds: ["psr_forge_b8f8787c7c13"],
    text: [
      "AgentForge turns human expertise into live, paid OKX.AI agent services.",
      "",
      "Live: ASP #3746, x402 payments, ledger-backed receipts, recovery hardening, verifier pages, and judge bundle.",
      "",
      `Proof: ${webOrigin}/judges`,
      "#OKXAI"
    ].join("\n")
  },
  {
    slug: "shieldcheck",
    evidenceRecordIds: ["bc_shieldcheck_2026-07-13", "psr_shieldcheck_642e7372000a"],
    text: [
      "ShieldCheck is my AgentForge-born soft-launch agent for phishing/scam review.",
      "",
      "Proof so far: born from a real paid AgentForge call + its own 0.40 USDT paid heartbeat, both verifiable.",
      "",
      `Open: ${webOrigin}/a/shieldcheck`,
      "#OKXAI"
    ].join("\n")
  },
  {
    slug: "launch-kit",
    evidenceRecordIds: ["psr_launch-kit_3b103d9976a5"],
    text: [
      "Launch Kit has a real paid heartbeat for OKX.AI listing-readiness checks.",
      "",
      "Proof: live Forge Gate PASS + one real 0.45 USDT paid heartbeat. Soft-launch transition still pending.",
      "",
      `Open: ${webOrigin}/a/launch-kit`,
      "#OKXAI"
    ].join("\n")
  }
] as const;

export function getLaunchEngine(): LaunchEngine {
  const crossTesting = getCrossTestingKit();

  return {
    title: "X Launch Engine",
    humanPublishRequired: true,
    reviewCount: crossTesting.reviews.length,
    globalRules: [
      "Founder edits the draft before posting.",
      "Human publishes manually; AgentForge does not post to X.",
      "Use evidence links from /verify, /guild, /dashboard, or /cross-test.",
      "Do not claim cross-test reviews until the review ledger contains real review text.",
      "Do not guarantee OKX approval, revenue, safety, or marketplace outcomes."
    ],
    drafts: draftPlans.map(buildDraft)
  };
}

export function assertLaunchDraftEvidence(draft: LaunchDraft) {
  if (draft.proofLinks.length === 0) {
    throw new Error(`Launch draft for ${draft.slug} has no proof links.`);
  }

  for (const link of draft.proofLinks) {
    const record = findVerificationRecord(link.recordId);

    if (!record) {
      throw new Error(`Launch draft ${draft.slug} references missing proof record ${link.recordId}.`);
    }
  }
}

function buildDraft(plan: (typeof draftPlans)[number]): LaunchDraft {
  const tenant = findStorefrontTenant(plan.slug);

  if (!tenant) {
    throw new Error(`Launch draft references unknown tenant: ${plan.slug}`);
  }

  const proofLinks = plan.evidenceRecordIds.map((recordId) => {
    const record = findVerificationRecord(recordId);

    if (!record) {
      throw new Error(`Launch draft references missing proof record: ${recordId}`);
    }

    return {
      label: record.title,
      href: `/verify/${record.recordId}`,
      recordId: record.recordId
    };
  });

  return {
    slug: tenant.slug,
    agentName: tenant.agentName,
    founderName: tenant.founderName ?? "AgentForge core",
    status: "ready_for_founder_edit",
    postText: plan.text,
    characterCount: plan.text.length,
    profileHref: `/a/${tenant.slug}`,
    proofLinks,
    editChecklist: [
      "Replace any first-person wording if the founder/operator is not the person posting.",
      "Keep one concrete proof point and one clear call to action.",
      "If adding a review quote, include the matching paid receipt and ServiceCall ID first.",
      "Re-check the final text against the do-not-claim list before publishing."
    ],
    mustNotClaim: [
      "guaranteed OKX approval",
      "guaranteed revenue",
      "independent customer reviews",
      "founders #2-#5 recruited",
      "full public launch for soft-launch tenants",
      "wallet custody or direct listing control"
    ]
  };
}
