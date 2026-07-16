import { formatUsdt, getDashboardSummary, type DashboardSummaryOptions } from "./dashboard-ledger";
import { getLaunchEngine } from "./launch-engine";
import { getProofLogEntries } from "./proof-log";
import { verificationRecords, xLayerTxUrl } from "./verify-records";

export type JudgeBundleLink = {
  label: string;
  href: string;
  kind: "internal" | "external";
};

export type JudgeBundle = {
  title: string;
  listing: {
    agentId: string;
    serviceName: string;
    price: string;
    status: string;
    links: JudgeBundleLink[];
    caveat: string;
  };
  metrics: Array<{
    label: string;
    value: string;
  }>;
  story: Array<{
    date: string;
    title: string;
    body: string;
  }>;
  primaryLinks: JudgeBundleLink[];
  receiptSamples: Array<{
    recordId: string;
    title: string;
    agentName: string;
    amount: string;
    verifierHref: string;
    paymentTxHref: string;
    anchorStatus: string;
    caveat: string;
  }>;
  founderLaunchPosts: {
    status: string;
    body: string;
    links: JudgeBundleLink[];
  };
  submissionHandoff: {
    status: string;
    xPostDraft: string;
    googleFormNotes: string[];
    remainingHumanSteps: string[];
  };
  proofLog: ReturnType<typeof getProofLogEntries>;
  doNotClaim: string[];
};

export async function getJudgeBundle(options: DashboardSummaryOptions = {}): Promise<JudgeBundle> {
  const dashboard = await getDashboardSummary(options);
  const launchEngine = getLaunchEngine();
  const proofLog = getProofLogEntries();

  return {
    title: "AgentForge M2 judge bundle",
    listing: {
      agentId: "#3746",
      serviceName: "AI Agent Business Builder",
      price: "0.40 USDT",
      status: "Approved OKX.AI listing record; marketplace visibility should be manually rechecked before final submission.",
      links: [
        { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
        { label: "Storefront", href: "/forge", kind: "internal" }
      ],
      caveat:
        "This page does not edit or query the OKX listing. It records the approved listing ID and points judges to live AgentForge surfaces."
    },
    metrics: [
      { label: "Ledger-backed paid calls", value: dashboard.paidCalls.toString() },
      { label: "Total settled", value: formatUsdt(dashboard.settledAtomic) },
      { label: "Forge revenue net", value: formatUsdt(dashboard.forgeRevenueAtomic) },
      { label: "Founder payable", value: formatUsdt(dashboard.founderPayableAtomic) },
      { label: "Verified cross-test reviews", value: launchEngine.reviewCount.toString() }
    ],
    story: [
      {
        date: "2026-07-04",
        title: "The delisting lesson",
        body:
          "The first marketplace attempt exposed the core risk: listed claims must match a reachable service. AgentForge recovered by removing the mismatched/unreachable path, keeping the callable A2MCP service, and making comm-readiness part of the operating checklist."
      },
      {
        date: "2026-07-06",
        title: "Listing record restored",
        body:
          "AgentForge #3746 is the OKX.AI listing record used for M2. Recent price edits mean visibility should still be checked by the operator immediately before form submission."
      },
      {
        date: "2026-07-13",
        title: "Paid proof became verifiable evidence",
        body:
          "The 1 USDT First Heartbeat was turned into balanced ledger rows, a proof-of-service receipt, and public verifier links."
      },
      {
        date: "2026-07-14",
        title: "Founder #1 and Launch Kit proof chain",
        body:
          "ShieldCheck now has its own paid heartbeat and anchored receipt. Launch Kit has a real self-operated paid heartbeat with an anchor-pending caveat. G2 did not pass: external founders remain zero."
      },
      {
        date: "2026-07-16",
        title: "Production hardening and launch packaging",
        body:
          "The paid path now has preflight quote binding, recovery instructions, post-settlement bookkeeping warnings, listener-level 402 tests, outage drills, catalog parity checks, and live no-payment runtime verification. Customer-specific vulnerability findings remain private and are not part of this public bundle."
      }
    ],
    primaryLinks: [
      { label: "Guild", href: "/guild", kind: "internal" },
      { label: "Dashboard", href: "/dashboard", kind: "internal" },
      { label: "Proof log", href: "/proof-log", kind: "internal" },
      { label: "Launch Engine", href: "/launch-engine", kind: "internal" },
      { label: "Buyer checkout", href: "/hire", kind: "internal" }
    ],
    receiptSamples: verificationRecords.map((record) => ({
      recordId: record.recordId,
      title: record.title,
      agentName: record.agentName,
      amount: record.evidence.amount,
      verifierHref: `/verify/${record.recordId}`,
      paymentTxHref: xLayerTxUrl(record.evidence.paymentTx),
      anchorStatus: record.anchor
        ? `Anchored on X Layer block ${record.anchor.blockNumber}`
        : "Anchor pending",
      caveat: record.caveat
    })),
    founderLaunchPosts: {
      status: "Drafts ready; no X post published by Codex.",
      body:
        "Founder/operator launch copy is generated from real proof links only. H6 remains human-owned, and no X/Twitter API action runs from AgentForge.",
      links: launchEngine.drafts.map((draft) => ({
        label: `${draft.agentName} draft`,
        href: "/launch-engine",
        kind: "internal" as const
      }))
    },
    submissionHandoff: {
      status: "Prepared for human submission; demo, X post, and Google form remain human-owned.",
      xPostDraft: [
        "AgentForge turns human expertise into live, paid OKX.AI agent services.",
        "",
        "Live: ASP #3746, x402 payments, ledger-backed receipts, recovery hardening, verifier pages, and a public judge bundle.",
        "",
        "https://web-one-peach-2vp0hv3dr1.vercel.app/judges",
        "#OKXAI"
      ].join("\n"),
      googleFormNotes: [
        "Project name: AgentForge",
        "Public judge bundle: https://web-one-peach-2vp0hv3dr1.vercel.app/judges",
        "Public service page: https://web-one-peach-2vp0hv3dr1.vercel.app/a/forge",
        "Runtime endpoint: https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge",
        "Core proof: approved listing #3746, live x402, ledger-backed receipts, anchored verifier records, hardening evidence, and honest caveats."
      ],
      remainingHumanSteps: [
        "Film the live demo from the prepared script.",
        "Publish the X post manually from the selected account.",
        "Submit the Google form with the live demo URL and public judge bundle.",
        "Add final submission URLs to the evidence pack after publishing."
      ]
    },
    proofLog,
    doNotClaim: [
      "Do not claim G2 passed; external founders remain 0.",
      "Do not claim Launch Kit is public-callable; it is heartbeat-stage / soft-launch transition pending.",
      "Do not claim independent customer reviews; verified cross-test reviews are 0.",
      "Do not claim guaranteed OKX approval, guaranteed revenue, guaranteed safety, wallet custody, or automatic listing control.",
      "Do not disclose customer-specific vulnerability findings, exploit payloads, private buyer inputs, or unpublished security reports.",
      "Do not expose or link internal planning documents from this public judge route."
    ]
  };
}

export function assertNoInternalPublicLinks(bundle: JudgeBundle) {
  const links = [
    ...bundle.listing.links,
    ...bundle.primaryLinks,
    ...bundle.founderLaunchPosts.links,
    ...bundle.proofLog.flatMap((entry) => entry.links),
    ...bundle.receiptSamples.map((receipt) => ({ label: receipt.title, href: receipt.verifierHref, kind: "internal" as const }))
  ];

  for (const link of links) {
    if (link.href.includes("ops/") || link.href.includes("audit-log") || link.href.includes("master-plan")) {
      throw new Error(`Public judge bundle leaks internal planning/evidence path: ${link.href}`);
    }
  }
}
