import { xLayerTxUrl } from "./verify-records";

export type ProofLogLink = {
  label: string;
  href: string;
  kind: "internal" | "external";
};

export type ProofLogEntry = {
  date: string;
  title: string;
  summary: string;
  metrics: string[];
  links: ProofLogLink[];
  caveat?: string;
};

export const proofLogEntries = [
  {
    date: "2026-07-06",
    title: "AgentForge listing reality reconciled",
    summary:
      "AgentForge has an OKX.AI listing record for #3746 after the relist/review path. The public claim is limited to the approved listing record and the live service surface.",
    metrics: ["Listing record: AgentForge #3746", "Service price now frozen for M2: 0.40 USDT"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Before final M2 submission, the operator should manually confirm marketplace search visibility because listing-price edits happened on Jul 14."
  },
  {
    date: "2026-07-07",
    title: "Launch Kit tenant surfaced",
    summary:
      "Launch Kit became the self-operated tenant focus for OKX.AI launch-readiness work. The public route exists, but the proof ladder was not complete on this date.",
    metrics: ["Tenant route: /a/launch-kit", "Launch state on Jul 7: pre-heartbeat / not yet fully proven"],
    links: [
      { label: "Launch Kit public page", href: "/a/launch-kit", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "This entry records the tenant surface, not a paid proof call. Launch Kit's real paid heartbeat happened later on Jul 14."
  },
  {
    date: "2026-07-08",
    title: "No new public proof recorded",
    summary:
      "The original schedule expected more ladder progress by this point. The proof log records the gap instead of backfilling a fake transaction or founder event.",
    metrics: ["New paid calls: 0", "New external founders: 0", "Carried public reference: AgentForge service page"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Quiet day: no new receipt, anchor, review, or founder go-live is claimed."
  },
  {
    date: "2026-07-09",
    title: "No new public proof recorded",
    summary:
      "The target plan had expected deeper Launch Kit and ledger progress, but no new public paid proof was recorded on this date.",
    metrics: ["New paid calls: 0", "New external founders: 0", "Carried public reference: AgentForge service page"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Quiet day: no new receipt, anchor, review, or founder go-live is claimed."
  },
  {
    date: "2026-07-10",
    title: "No new public proof recorded",
    summary:
      "Dashboard, certificates, and proof-log targets slipped. This page keeps the miss visible instead of turning it into a retrospective success claim.",
    metrics: ["New paid calls: 0", "New external founders: 0", "Carried public reference: AgentForge service page"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Quiet day: no new receipt, anchor, review, or founder go-live is claimed."
  },
  {
    date: "2026-07-11",
    title: "No new public proof recorded",
    summary:
      "T5 template/referral work was still not publicly assembled. No external traction or review claim is made for this date.",
    metrics: ["New paid calls: 0", "New external founders: 0", "Carried public reference: AgentForge service page"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Quiet day: no new receipt, anchor, review, or founder go-live is claimed."
  },
  {
    date: "2026-07-12",
    title: "No new public proof recorded",
    summary:
      "The public evidence chain had not yet caught up to the M2 plan. The current proof log records that as a zero-update day.",
    metrics: ["New paid calls: 0", "New external founders: 0", "Carried public reference: AgentForge service page"],
    links: [
      { label: "AgentForge public service page", href: "/a/forge", kind: "internal" },
      { label: "Storefront", href: "/forge", kind: "internal" }
    ],
    caveat:
      "Quiet day: no new receipt, anchor, review, or founder go-live is claimed."
  },
  {
    date: "2026-07-13",
    title: "First paid AgentForge proof formalized",
    summary:
      "The original 1 USDT x402 First Heartbeat is represented as a proof-of-service receipt and tied to the ledger/accounting chain.",
    metrics: ["Paid call: 1.000000 USDT", "Receipt: psr_forge_b8f8787c7c13"],
    links: [
      { label: "AgentForge receipt", href: "/verify/psr_forge_b8f8787c7c13", kind: "internal" },
      {
        label: "First Heartbeat payment tx",
        href: xLayerTxUrl("0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b"),
        kind: "external"
      }
    ],
    caveat:
      "This receipt proves AgentForge delivered /svc/forge; it does not claim ShieldCheck had its own paid customer call at that time."
  },
  {
    date: "2026-07-13",
    title: "ForgeAnchor and ShieldCheck birth certificate",
    summary:
      "ForgeAnchor is live on X Layer and ShieldCheck has a birth certificate proving it was born from the paid AgentForge forge call.",
    metrics: [
      "ForgeAnchor: 0xfd43a18b2c09903922fa452f6813e7577c48569d",
      "Certificate: bc_shieldcheck_2026-07-13"
    ],
    links: [
      { label: "ShieldCheck certificate", href: "/verify/bc_shieldcheck_2026-07-13", kind: "internal" },
      {
        label: "Certificate anchor tx",
        href: xLayerTxUrl("0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a"),
        kind: "external"
      }
    ],
    caveat:
      "The certificate proves origin, not guaranteed safety, revenue, OKX approval, or full public launch."
  },
  {
    date: "2026-07-14",
    title: "ShieldCheck paid heartbeat anchored",
    summary:
      "ShieldCheck passed the live Forge Gate, completed its own 0.40 USDT paid heartbeat, and has an anchored proof-of-service receipt.",
    metrics: ["Paid call: 0.400000 USDT", "Receipt: psr_shieldcheck_642e7372000a"],
    links: [
      {
        label: "ShieldCheck heartbeat receipt",
        href: "/verify/psr_shieldcheck_642e7372000a",
        kind: "internal"
      },
      {
        label: "ShieldCheck payment tx",
        href: xLayerTxUrl("0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5"),
        kind: "external"
      },
      {
        label: "ShieldCheck receipt anchor tx",
        href: xLayerTxUrl("0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273"),
        kind: "external"
      }
    ],
    caveat:
      "ShieldCheck remains controlled soft-launch; the receipt is not a guarantee that every reviewed site or transaction is safe."
  },
  {
    date: "2026-07-14",
    title: "Launch Kit paid heartbeat recorded",
    summary:
      "Launch Kit has a live Forge Gate PASS and a real 0.45 USDT paid heartbeat, but it remains heartbeat-stage until its next transition proof.",
    metrics: ["Paid call: 0.450000 USDT", "Receipt: psr_launch-kit_3b103d9976a5"],
    links: [
      { label: "Launch Kit receipt", href: "/verify/psr_launch-kit_3b103d9976a5", kind: "internal" },
      {
        label: "Launch Kit payment tx",
        href: xLayerTxUrl("0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a"),
        kind: "external"
      }
    ],
    caveat:
      "This is a self-operated proof call, not an independent customer review or external-founder traction claim. Its receipt is still anchor-pending."
  },
  {
    date: "2026-07-14",
    title: "M2 evidence surfaces assembled",
    summary:
      "The Guild, dashboard, verifier pages, launch engine, proof log, and judge bundle provide one public route through the real evidence chain.",
    metrics: ["Public proof-backed entries: AgentForge, ShieldCheck, Launch Kit", "Cross-test reviews: 0"],
    links: [
      { label: "Guild", href: "/guild", kind: "internal" },
      { label: "Dashboard", href: "/dashboard", kind: "internal" },
      { label: "Launch Engine", href: "/launch-engine", kind: "internal" },
      { label: "Judge bundle", href: "/judges", kind: "internal" }
    ],
    caveat:
      "Founder launch posts and Google form submission remain human-owned and should happen only after live demo filming."
  },
  {
    date: "2026-07-14",
    title: "x402 replay recovery and quote binding added",
    summary:
      "A paid Business Builder replay gap exposed that x402 parameterized services need buyer-visible fallback paths. AgentForge added preflight-plus-recovery instructions, a recovery endpoint for lost paid responses, and quote-bound paid endpoints so an OKX task replay that sends {} can recover only the preflight-validated body before settlement.",
    metrics: [
      "Recovery route: /svc/forge/recovery",
      "Quote-bound paid endpoint: /svc/forge?af_quote=...",
      "Review policy: inspect deliverable before completion or review",
      "Public review claims from this incident: 0"
    ],
    links: [
      { label: "Buyer checkout and recovery", href: "/hire", kind: "internal" },
      { label: "AgentForge service page", href: "/a/forge", kind: "internal" }
    ],
    caveat:
      "This records reliability fixes and make-good paths. It does not publish the buyer's private input or claim a marketplace review."
  },
  {
    date: "2026-07-16",
    title: "Production hardening and final packaging",
    summary:
      "AgentForge closed the remaining controlled-production gaps: listener-level 402 contract tests, catalog drift prevention, non-paid outage drills, production readiness checks, and a final public-safe launch evidence pack.",
    metrics: [
      "Live runtime verifier: /health, /ready, /svc/forge/info, unpaid 402, preflight, malformed-body rejection",
      "Live ledger at packaging time: 11 paid calls / 5.050000 USDT settled",
      "Security posture: private customer vulnerability details excluded from public launch materials",
      "Scaling caveat: JSONL ledger scoped to declared single-instance or shared-volume deployment"
    ],
    links: [
      { label: "Judge bundle", href: "/judges", kind: "internal" },
      { label: "Dashboard", href: "/dashboard", kind: "internal" },
      { label: "Buyer checkout", href: "/hire", kind: "internal" },
      { label: "Launch Engine", href: "/launch-engine", kind: "internal" }
    ],
    caveat:
      "This entry is public-safe. It intentionally omits customer-specific security findings and exploit details."
  }
] as const satisfies readonly ProofLogEntry[];

export function getProofLogEntries() {
  return proofLogEntries.map((entry) => ({
    ...entry,
    metrics: [...entry.metrics],
    links: entry.links.map((link) => ({ ...link }))
  }));
}
