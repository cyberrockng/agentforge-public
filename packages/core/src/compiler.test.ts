import { describe, expect, it } from "vitest";
import { type AgentSpec } from "./index.js";
import { compileAgentSpec } from "./compiler.js";

const spec: AgentSpec = {
  id: "agent_01",
  founder_id: "founder_01",
  agent_name: "AdaAudit AI",
  slug: "adaaudit-ai",
  category: "software",
  persona: {
    system_prompt: "Review launch plans without making guarantees.",
    tone: "precise",
    bio: "A launch-readiness review agent."
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
    refusal_policy: [
      "Do not guarantee legal, financial, or security outcomes.",
      "Do not handle private keys."
    ],
    out_of_scope: ["Private key recovery"]
  },
  knowledge: {
    facts: ["AgentForge public claims require real evidence."],
    documents: []
  },
  status: "draft",
  forge_gate: {
    passed: false,
    score: 0,
    report_id: null
  },
  created_at: "2026-07-03T00:00:00.000Z"
};

describe("compileAgentSpec", () => {
  it("compiles deterministically", () => {
    expect(compileAgentSpec(spec)).toEqual(compileAgentSpec(spec));
  });

  it("keeps every refusal boundary verbatim in the compiled prompt", () => {
    const compiled = compileAgentSpec(spec);

    for (const boundary of spec.boundaries.refusal_policy) {
      expect(compiled.compiled_prompt).toContain(boundary);
    }
  });

  it("includes service routing and price data", () => {
    const compiled = compileAgentSpec(spec);

    expect(compiled.services).toEqual([
      {
        service_id: "launch_review",
        title: "Launch Review",
        price_usdt: 15,
        required_inputs: ["project summary", "target user"],
        output_format: "structured checklist"
      }
    ]);
  });
});

