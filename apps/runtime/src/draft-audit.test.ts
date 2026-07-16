import { describe, expect, it } from "vitest";
import type { AgentSpecDraft } from "@agentforge/core";
import { buildAgentSpecDraftAudit } from "./draft-audit.js";

describe("agent spec draft audit", () => {
  it("summarizes raw model drafts without exposing them as buyer-facing copy", () => {
    const draft = {
      agent_name: "PolicyPool",
      category: "finance",
      persona: {
        system_prompt: "Draft scaffold",
        tone: "confident",
        bio: "Intermediate draft"
      },
      services: [
        {
          service_id: "free_preflight",
          title: "Free Eligibility Preflight",
          description: "Draft preflight",
          price_usdt: 0,
          required_inputs: ["job id"],
          output_format: "report"
        },
        {
          service_id: "generic_pack",
          title: "Generic Launch Pack",
          description: "Draft generic pack",
          price_usdt: 15,
          required_inputs: ["notes"],
          output_format: "pack"
        }
      ],
      boundaries: {
        refusal_policy: ["Do not guarantee outcomes."],
        out_of_scope: ["Legal advice"]
      },
      knowledge: {
        facts: [],
        documents: []
      }
    } satisfies AgentSpecDraft;

    expect(buildAgentSpecDraftAudit(draft)).toEqual({
      source: "model_draft",
      buyerFacingCopy: false,
      rawDraftOmitted: true,
      reason: expect.stringContaining("intermediate scaffold"),
      agentName: "PolicyPool",
      category: "finance",
      serviceCount: 2,
      serviceTitles: ["Free Eligibility Preflight", "Generic Launch Pack"],
      priceRangeUsdt: {
        min: 0,
        max: 15
      },
      repairedBy: "BusinessBuilderDeliverable",
      useInstead: "deliverable"
    });
  });
});

