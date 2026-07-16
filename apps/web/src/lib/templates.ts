export type TemplateGalleryItem = {
  id: string;
  title: string;
  sourceLabel: string;
  category: "finance" | "software" | "lifestyle" | "art" | "education" | "business";
  displayPrice: string;
  summary: string;
  bestFor: string[];
  buyerInputs: string[];
  outputFormat: string;
  boundaries: string[];
  personalizationFields: string[];
  caveat: string;
};

const templates = [
  {
    id: "launch-readiness-review",
    title: "Launch Readiness Review",
    sourceLabel: "Launch Kit-derived",
    category: "business",
    displayPrice: "0.45 USDT base",
    summary:
      "Turns rough launch notes into a readiness verdict, mismatch check, short demo plan, launch post draft, and proof checklist.",
    bestFor: [
      "OKX.AI builders preparing to publish or update a service",
      "Founders who need a second pair of eyes before review",
      "Agents recovering from listing or comm-readiness issues"
    ],
    buyerInputs: [
      "Project or agent name",
      "Category and target user",
      "Current listing/service copy",
      "Live endpoint or delivery path",
      "Known blocker, reviewer feedback, or launch concern"
    ],
    outputFormat:
      "Readiness verdict, listing mismatch check, 90-second demo shotlist, launch post draft, and proof checklist.",
    boundaries: [
      "Do not promise marketplace acceptance or reviewer outcomes.",
      "Do not advise publishing an unreachable, fake, or mismatched service.",
      "Do not claim receipts, reviews, anchors, or customers that are not supplied as evidence."
    ]
  },
  {
    id: "phishing-scam-review",
    title: "Phishing & Scam Review",
    sourceLabel: "ShieldCheck-derived",
    category: "software",
    displayPrice: "0.40 USDT base",
    summary:
      "Reviews a suspicious link, message, airdrop, approval request, or transaction prompt for scam indicators and safe next steps.",
    bestFor: [
      "Security-aware founders serving crypto users",
      "Wallet safety education services",
      "Support teams triaging suspicious messages before escalation"
    ],
    buyerInputs: [
      "Suspicious URL, message, screenshot description, or transaction request",
      "How the buyer received it",
      "Whether the buyer has clicked, connected, signed, or paid",
      "Any public contract, app, or sender reference the buyer wants reviewed"
    ],
    outputFormat:
      "Risk verdict, red flags, evidence notes, safe next steps, and a clear refusal to handle secrets.",
    boundaries: [
      "Do not request seed phrases, private keys, OTPs, or secret platform credentials.",
      "Do not promise fund recovery or complete safety.",
      "Do not provide hacking instructions, exploit steps, or targeting help."
    ]
  },
  {
    id: "listing-copy-clinic",
    title: "Listing Copy Clinic",
    sourceLabel: "AgentForge blueprint",
    category: "business",
    displayPrice: "0.40 USDT base",
    summary:
      "Tightens a service listing so the public claim, endpoint behavior, buyer inputs, and proof status line up.",
    bestFor: [
      "Agents with confusing service descriptions",
      "Founders preparing an OKX.AI listing edit",
      "Builders who need buyer-facing copy that stays within evidence"
    ],
    buyerInputs: [
      "Current listing title and description",
      "Actual service behavior",
      "Current launch status",
      "Known proof assets",
      "What the founder wants buyers to understand faster"
    ],
    outputFormat:
      "Rewritten title, short description, buyer input list, caveat line, and reviewer-facing consistency checklist.",
    boundaries: [
      "Do not create claims beyond the provided proof.",
      "Do not hide material caveats about service status or delivery limits.",
      "Do not write copy that implies direct account, wallet, or listing control unless that control is real."
    ]
  },
  {
    id: "evidence-pack-builder",
    title: "Evidence Pack Builder",
    sourceLabel: "AgentForge blueprint",
    category: "business",
    displayPrice: "0.40 USDT base",
    summary:
      "Packages screenshots, transaction refs, receipts, public URLs, and caveats into a checkable proof bundle.",
    bestFor: [
      "Founders with scattered launch proof",
      "Teams preparing judge, investor, or customer evidence",
      "Agents that need a clean receipt and verification narrative"
    ],
    buyerInputs: [
      "Public URLs to verify",
      "Payment, receipt, or transaction references",
      "Listing or profile identifiers",
      "What claim the evidence should support",
      "Known gaps or caveats"
    ],
    outputFormat:
      "Evidence table, claim-to-proof map, missing-proof list, and short public proof narrative.",
    boundaries: [
      "Do not treat unverified links or screenshots as conclusive proof.",
      "Do not invent transaction hashes, reviews, ratings, anchors, customers, or approvals.",
      "Do not expose private keys, API keys, or secret operational details."
    ]
  },
  {
    id: "support-triage-agent",
    title: "Support Triage Agent",
    sourceLabel: "AgentForge blueprint",
    category: "business",
    displayPrice: "0.40 USDT base",
    summary:
      "Turns a founder's support workflow into a paid triage service with intake questions, severity labels, and escalation rules.",
    bestFor: [
      "Operators who answer the same customer questions repeatedly",
      "Service businesses that need first-pass intake",
      "Founders with clear escalation boundaries"
    ],
    buyerInputs: [
      "Customer issue summary",
      "Product, service, or account context",
      "What the buyer already tried",
      "Urgency or deadline",
      "Evidence, screenshots, or logs the buyer can safely share"
    ],
    outputFormat:
      "Issue summary, severity label, likely cause, next safe steps, and escalation note for the human founder.",
    boundaries: [
      "Do not access customer accounts or request passwords, OTPs, or private credentials.",
      "Do not promise resolution, refunds, or platform action.",
      "Do not make legal, medical, or regulated financial determinations."
    ]
  }
] satisfies Array<Omit<TemplateGalleryItem, "personalizationFields" | "caveat">>;

export function getTemplateGallery(): TemplateGalleryItem[] {
  return templates.map((template) => ({
    ...template,
    bestFor: [...template.bestFor],
    buyerInputs: [...template.buyerInputs],
    boundaries: [...template.boundaries],
    personalizationFields: [
      "Founder name",
      "Brand name",
      "Target customer",
      "Expertise area",
      "Service focus",
      "Founder boundaries",
      "Tone",
      "Pricing preference"
    ],
    caveat:
      "Template output is a draft only. It is not a listed agent, receipt, review, customer win, or approval claim until the real launch ladder produces evidence."
  }));
}
