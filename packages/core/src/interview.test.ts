import { describe, expect, it } from "vitest";
import { parseAgentSpec } from "./index.js";
import { assertProductionModelClient, type ModelClient } from "./model-client.js";
import { createAgentSpecDraft, finalizeAgentSpecDraft } from "./interview.js";

const testStubClient: ModelClient = {
  kind: "test-stub",
  async generateStructured({ schema }) {
    return schema.parse({
      agent_name: "AdaAudit AI",
      category: "software",
      persona: {
        system_prompt: "Review simple software launches without making guarantees.",
        tone: "precise",
        bio: "A narrow launch-readiness review agent."
      },
      services: [
        {
          service_id: "launch_review",
          title: "Launch Review",
          description: "Reviews a launch plan for gaps.",
          price_usdt: 15,
          required_inputs: ["project summary", "target user"],
          output_format: "structured checklist"
        }
      ],
      boundaries: {
        refusal_policy: ["Do not guarantee legal, financial, or security outcomes."],
        out_of_scope: ["Private key handling"]
      },
      knowledge: {
        facts: ["AgentForge requires real evidence for public claims."],
        documents: []
      }
    });
  }
};

describe("createAgentSpecDraft", () => {
  it("creates a valid draft through the model client boundary", async () => {
    const draft = await createAgentSpecDraft(
      {
        founderName: "Ada",
        expertiseArea: "software launch reviews",
        targetCustomer: "early-stage builders",
        servicesOffered: ["launch readiness review"],
        boundaries: ["no legal guarantees", "no private key handling"],
        tone: "precise",
        pricingPreference: "15 USDT"
      },
      testStubClient
    );

    const spec = finalizeAgentSpecDraft({
      id: "agent_01",
      founderId: "founder_01",
      slug: "adaaudit-ai",
      createdAt: "2026-07-03T00:00:00.000Z",
      draft
    });

    expect(parseAgentSpec(spec).status).toBe("draft");
    expect(spec.forge_gate.passed).toBe(false);
  });
});

describe("assertProductionModelClient", () => {
  it("allows the test stub outside production", () => {
    expect(() => assertProductionModelClient(testStubClient, "test")).not.toThrow();
  });

  it("refuses to boot production with the test stub", () => {
    expect(() => assertProductionModelClient(testStubClient, "production")).toThrow(
      "Refusing to boot production with test-stub model client"
    );
  });
});

