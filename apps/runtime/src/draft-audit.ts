import type { AgentSpecDraft } from "@agentforge/core";

export type AgentSpecDraftAudit = {
  source: "model_draft";
  buyerFacingCopy: false;
  rawDraftOmitted: true;
  reason: string;
  agentName: string;
  category: string;
  serviceCount: number;
  serviceTitles: string[];
  priceRangeUsdt: {
    min: number;
    max: number;
  } | null;
  repairedBy: "BusinessBuilderDeliverable";
  useInstead: "deliverable";
};

export function buildAgentSpecDraftAudit(draft: AgentSpecDraft): AgentSpecDraftAudit {
  const prices = draft.services
    .map((service) => service.price_usdt)
    .filter((price) => Number.isFinite(price));

  return {
    source: "model_draft",
    buyerFacingCopy: false,
    rawDraftOmitted: true,
    reason:
      "The raw model draft is intermediate scaffold. AgentForge returns the repaired deliverable as the buyer-facing product to avoid exposing contradictory unrepaired draft copy.",
    agentName: draft.agent_name,
    category: draft.category,
    serviceCount: draft.services.length,
    serviceTitles: draft.services.map((service) => service.title),
    priceRangeUsdt:
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        : null,
    repairedBy: "BusinessBuilderDeliverable",
    useInstead: "deliverable"
  };
}

