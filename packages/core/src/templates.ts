import { z } from "zod";
import type { AgentSpecDraft } from "./interview.js";

export const ForgeTemplateSourceSchema = z.enum([
  "launch-kit-derived",
  "shieldcheck-derived",
  "agentforge-blueprint"
]);

export type ForgeTemplateSource = z.infer<typeof ForgeTemplateSourceSchema>;

export const ForgeTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source: ForgeTemplateSourceSchema,
  category: z.enum(["finance", "software", "lifestyle", "art", "education", "business"]),
  basePriceUsdt: z.number().positive(),
  summary: z.string().min(1),
  bestFor: z.array(z.string().min(1)).min(1),
  serviceId: z.string().min(1),
  serviceTitle: z.string().min(1),
  buyerInputs: z.array(z.string().min(1)).min(1),
  outputFormat: z.string().min(1),
  baseBoundaries: z.array(z.string().min(1)).min(1),
  knowledgeFacts: z.array(z.string().min(1)).min(1)
});

export type ForgeTemplate = z.infer<typeof ForgeTemplateSchema>;

export const TemplateForgeInputSchema = z.object({
  templateId: z.string().min(1),
  founderName: z.string().min(1),
  targetCustomer: z.string().min(1),
  expertiseArea: z.string().min(1),
  serviceFocus: z.string().min(1),
  boundaries: z.array(z.string().min(1)).min(1),
  tone: z.string().min(1),
  pricingPreference: z.string().min(1),
  brandName: z.string().min(1).optional()
});

export type TemplateForgeInput = z.infer<typeof TemplateForgeInputSchema>;

const templates = [
  {
    id: "launch-readiness-review",
    title: "Launch Readiness Review",
    source: "launch-kit-derived",
    category: "business",
    basePriceUsdt: 0.45,
    summary:
      "Turns rough launch notes into a readiness verdict, mismatch check, short demo plan, launch post draft, and proof checklist.",
    bestFor: [
      "OKX.AI builders preparing to publish or update a service",
      "Founders who need a second pair of eyes before review",
      "Agents recovering from listing or comm-readiness issues"
    ],
    serviceId: "launch_readiness_review",
    serviceTitle: "Launch Readiness Review",
    buyerInputs: [
      "Project or agent name",
      "Category and target user",
      "Current listing/service copy",
      "Live endpoint or delivery path",
      "Known blocker, reviewer feedback, or launch concern"
    ],
    outputFormat:
      "Readiness verdict, listing mismatch check, 90-second demo shotlist, launch post draft, and proof checklist.",
    baseBoundaries: [
      "Do not promise marketplace acceptance or reviewer outcomes.",
      "Do not advise publishing an unreachable, fake, or mismatched service.",
      "Do not claim receipts, reviews, anchors, or customers that are not supplied as evidence."
    ],
    knowledgeFacts: [
      "This template is derived from AgentForge's Launch Kit tenant.",
      "A service should not be described as public until its delivery path is actually callable.",
      "Proof bundles should distinguish real customer evidence from self-operated proof calls."
    ]
  },
  {
    id: "phishing-scam-review",
    title: "Phishing & Scam Review",
    source: "shieldcheck-derived",
    category: "software",
    basePriceUsdt: 0.4,
    summary:
      "Reviews a suspicious link, message, airdrop, approval request, or transaction prompt for scam indicators and safe next steps.",
    bestFor: [
      "Security-aware founders serving crypto users",
      "Wallet safety education services",
      "Support teams triaging suspicious messages before escalation"
    ],
    serviceId: "phishing_scam_review",
    serviceTitle: "Phishing & Scam Review",
    buyerInputs: [
      "Suspicious URL, message, screenshot description, or transaction request",
      "How the buyer received it",
      "Whether the buyer has clicked, connected, signed, or paid",
      "Any public contract, app, or sender reference the buyer wants reviewed"
    ],
    outputFormat:
      "Risk verdict, red flags, evidence notes, safe next steps, and a clear refusal to handle secrets.",
    baseBoundaries: [
      "Do not request seed phrases, private keys, OTPs, or secret platform credentials.",
      "Do not promise fund recovery or complete safety.",
      "Do not provide hacking instructions, exploit steps, or targeting help."
    ],
    knowledgeFacts: [
      "This template is derived from ShieldCheck's proven scam-review flow.",
      "Security review uses buyer-provided descriptions and public information only.",
      "A safe service should refuse any request that requires secrets or wallet custody."
    ]
  },
  {
    id: "listing-copy-clinic",
    title: "Listing Copy Clinic",
    source: "agentforge-blueprint",
    category: "business",
    basePriceUsdt: 0.4,
    summary:
      "Tightens a service listing so the public claim, endpoint behavior, buyer inputs, and proof status line up.",
    bestFor: [
      "Agents with confusing service descriptions",
      "Founders preparing an OKX.AI listing edit",
      "Builders who need buyer-facing copy that stays within evidence"
    ],
    serviceId: "listing_copy_clinic",
    serviceTitle: "Listing Copy Clinic",
    buyerInputs: [
      "Current listing title and description",
      "Actual service behavior",
      "Current launch status",
      "Known proof assets",
      "What the founder wants buyers to understand faster"
    ],
    outputFormat:
      "Rewritten title, short description, buyer input list, caveat line, and reviewer-facing consistency checklist.",
    baseBoundaries: [
      "Do not create claims beyond the provided proof.",
      "Do not hide material caveats about service status or delivery limits.",
      "Do not write copy that implies direct account, wallet, or listing control unless that control is real."
    ],
    knowledgeFacts: [
      "Visible copy should match observable service behavior.",
      "A delisting risk increases when listing claims outrun the live endpoint.",
      "Buyer-facing copy should be narrow enough for the founder to deliver repeatedly."
    ]
  },
  {
    id: "evidence-pack-builder",
    title: "Evidence Pack Builder",
    source: "agentforge-blueprint",
    category: "business",
    basePriceUsdt: 0.4,
    summary:
      "Packages screenshots, transaction refs, receipts, public URLs, and caveats into a checkable proof bundle.",
    bestFor: [
      "Founders with scattered launch proof",
      "Teams preparing judge, investor, or customer evidence",
      "Agents that need a clean receipt and verification narrative"
    ],
    serviceId: "evidence_pack_builder",
    serviceTitle: "Evidence Pack Builder",
    buyerInputs: [
      "Public URLs to verify",
      "Payment, receipt, or transaction references",
      "Listing or profile identifiers",
      "What claim the evidence should support",
      "Known gaps or caveats"
    ],
    outputFormat:
      "Evidence table, claim-to-proof map, missing-proof list, and short public proof narrative.",
    baseBoundaries: [
      "Do not treat unverified links or screenshots as conclusive proof.",
      "Do not invent transaction hashes, reviews, ratings, anchors, customers, or approvals.",
      "Do not expose private keys, API keys, or secret operational details."
    ],
    knowledgeFacts: [
      "AgentForge public proof uses real paid calls, receipts, anchors, ledger rows, and live URLs.",
      "A strong evidence pack maps each public claim to a verifiable reference.",
      "Unknown or missing proof should be labeled as a gap, not filled with assumptions."
    ]
  },
  {
    id: "support-triage-agent",
    title: "Support Triage Agent",
    source: "agentforge-blueprint",
    category: "business",
    basePriceUsdt: 0.4,
    summary:
      "Turns a founder's support workflow into a paid triage service with intake questions, severity labels, and escalation rules.",
    bestFor: [
      "Operators who answer the same customer questions repeatedly",
      "Service businesses that need first-pass intake",
      "Founders with clear escalation boundaries"
    ],
    serviceId: "support_triage",
    serviceTitle: "Support Triage",
    buyerInputs: [
      "Customer issue summary",
      "Product, service, or account context",
      "What the buyer already tried",
      "Urgency or deadline",
      "Evidence, screenshots, or logs the buyer can safely share"
    ],
    outputFormat:
      "Issue summary, severity label, likely cause, next safe steps, and escalation note for the human founder.",
    baseBoundaries: [
      "Do not access customer accounts or request passwords, OTPs, or private credentials.",
      "Do not promise resolution, refunds, or platform action.",
      "Do not make legal, medical, or regulated financial determinations."
    ],
    knowledgeFacts: [
      "Triage services should reduce repeated founder labor without pretending to replace the founder.",
      "Escalation rules should be explicit before the service is sold.",
      "Safe support intake avoids secrets and collects only the minimum useful context."
    ]
  }
] satisfies ForgeTemplate[];

export function listForgeTemplates(): ForgeTemplate[] {
  return templates.map(cloneTemplate);
}

export function findForgeTemplate(templateId: string): ForgeTemplate | null {
  const template = templates.find((entry) => entry.id === templateId);
  return template ? cloneTemplate(template) : null;
}

export function createTemplateAgentSpecDraft(input: TemplateForgeInput): AgentSpecDraft {
  const parsed = TemplateForgeInputSchema.parse(input);
  const template = findForgeTemplate(parsed.templateId);

  if (!template) {
    throw new Error(`Unknown template id: ${parsed.templateId}`);
  }

  const agentName = parsed.brandName ?? `${parsed.founderName} ${template.serviceTitle}`;
  const priceUsdt = parsePriceUsdt(parsed.pricingPreference) ?? template.basePriceUsdt;
  const founderBoundaries = uniqueLines(parsed.boundaries);
  const refusalPolicy = uniqueLines([...template.baseBoundaries, ...founderBoundaries]);

  return {
    agent_name: agentName,
    category: template.category,
    persona: {
      system_prompt: [
        `You are ${agentName}, a narrow paid service operated by ${parsed.founderName}.`,
        `Serve ${parsed.targetCustomer} using the ${template.title} template.`,
        `Founder expertise: ${parsed.expertiseArea}.`,
        `Service focus: ${parsed.serviceFocus}.`,
        "Use only buyer-provided information and public, checkable facts.",
        "State uncertainty clearly and separate evidence from assumptions.",
        "Refuse requests outside the listed boundaries."
      ].join("\n"),
      tone: parsed.tone,
      bio: `${agentName} helps ${parsed.targetCustomer} with ${parsed.serviceFocus} using ${parsed.founderName}'s ${parsed.expertiseArea} expertise.`
    },
    services: [
      {
        service_id: template.serviceId,
        title: template.serviceTitle,
        description: `${template.summary} Personalized for ${parsed.targetCustomer} with focus on ${parsed.serviceFocus}.`,
        price_usdt: priceUsdt,
        required_inputs: [...template.buyerInputs],
        output_format: template.outputFormat
      }
    ],
    boundaries: {
      refusal_policy: refusalPolicy,
      out_of_scope: [
        "Requests requiring private keys, seed phrases, passwords, OTPs, or secret credentials.",
        "Claims about customers, revenue, receipts, approvals, anchors, or reviews without supplied evidence.",
        "Direct wallet, account, listing, or platform-control actions unless the founder has explicitly built and proven that capability."
      ]
    },
    knowledge: {
      facts: [
        `Template source: ${template.source}.`,
        `Template id: ${template.id}.`,
        `Founder/operator: ${parsed.founderName}.`,
        `Target customer: ${parsed.targetCustomer}.`,
        `Expertise area: ${parsed.expertiseArea}.`,
        "This draft is a template output only; it becomes a public agent only after real founder consent, Forge Gate, paid heartbeat, receipt evidence, and the required launch-ladder checks.",
        ...template.knowledgeFacts
      ],
      documents: []
    }
  };
}

function cloneTemplate(template: ForgeTemplate): ForgeTemplate {
  return {
    ...template,
    bestFor: [...template.bestFor],
    buyerInputs: [...template.buyerInputs],
    baseBoundaries: [...template.baseBoundaries],
    knowledgeFacts: [...template.knowledgeFacts]
  };
}

function uniqueLines(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parsePriceUsdt(value: string) {
  const match = value.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s*(?:USDT|USD|\$))?/i);

  if (!match?.[1]) {
    return null;
  }

  const parsed = Number(match[1]);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
