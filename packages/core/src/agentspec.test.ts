import { describe, expect, it } from "vitest";
import {
  type AgentSpec,
  agentSpecHash,
  assertStatusTransition,
  canonicalJson,
  parseAgentSpec
} from "./index.js";

const baseSpec: AgentSpec = {
  id: "agent_01",
  founder_id: "founder_01",
  agent_name: "AdaAudit AI",
  slug: "adaaudit-ai",
  category: "software",
  persona: {
    system_prompt: "Review simple software launch plans.",
    tone: "precise",
    bio: "A focused software review agent."
  },
  services: [
    {
      service_id: "svc_01",
      title: "Launch Review",
      description: "Reviews launch readiness.",
      price_usdt: 15,
      required_inputs: ["project summary"],
      output_format: "checklist"
    }
  ],
  boundaries: {
    refusal_policy: ["Do not guarantee legal, financial, or medical outcomes."],
    out_of_scope: ["Requests for private keys"]
  },
  knowledge: {
    facts: ["AgentForge ships real services only."],
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

describe("AgentSpecSchema", () => {
  it("accepts a valid AgentSpec", () => {
    expect(parseAgentSpec(baseSpec)).toEqual(baseSpec);
  });

  it("rejects invalid slugs", () => {
    expect(() => parseAgentSpec({ ...baseSpec, slug: "Bad Slug" })).toThrow();
  });

  it("hashes stable across object key ordering", () => {
    const reordered = {
      created_at: baseSpec.created_at,
      forge_gate: baseSpec.forge_gate,
      status: baseSpec.status,
      knowledge: baseSpec.knowledge,
      boundaries: baseSpec.boundaries,
      services: baseSpec.services,
      persona: baseSpec.persona,
      category: baseSpec.category,
      slug: baseSpec.slug,
      agent_name: baseSpec.agent_name,
      founder_id: baseSpec.founder_id,
      id: baseSpec.id
    };

    expect(canonicalJson(baseSpec)).toEqual(canonicalJson(reordered));
    expect(agentSpecHash(baseSpec)).toEqual(agentSpecHash(reordered as AgentSpec));
  });
});

describe("assertStatusTransition", () => {
  it("allows draft->gated with passing Forge Gate evidence", () => {
    const spec = {
      ...baseSpec,
      forge_gate: { passed: true, score: 91, report_id: "report_01" }
    };

    expect(() => assertStatusTransition(spec, "gated")).not.toThrow();
  });

  it("rejects draft->gated without passing Forge Gate evidence", () => {
    expect(() => assertStatusTransition(baseSpec, "gated")).toThrow(
      "draft->gated requires passing Forge Gate evidence"
    );
  });

  it("rejects gated->heartbeat without a real payment_ref", () => {
    const spec = {
      ...baseSpec,
      status: "gated" as const,
      forge_gate: { passed: true, score: 90, report_id: "report_01" }
    };

    expect(() => assertStatusTransition(spec, "heartbeat")).toThrow(
      "gated->heartbeat requires a real heartbeat payment_ref"
    );
  });

  it("allows gated->heartbeat with a real payment_ref", () => {
    const spec = {
      ...baseSpec,
      status: "gated" as const,
      forge_gate: { passed: true, score: 90, report_id: "report_01" }
    };

    expect(() =>
      assertStatusTransition(spec, "heartbeat", { hasHeartbeatPaymentRef: true })
    ).not.toThrow();
  });

  it("rejects heartbeat->softlaunch without birth certificate", () => {
    expect(() =>
      assertStatusTransition({ ...baseSpec, status: "heartbeat" }, "softlaunch")
    ).toThrow("heartbeat->softlaunch requires a birth certificate");
  });

  it("rejects softlaunch->public without non-founder call", () => {
    expect(() => assertStatusTransition({ ...baseSpec, status: "softlaunch" }, "public")).toThrow(
      "softlaunch->public requires a real non-founder softlaunch call"
    );
  });

  it("rejects illegal jumps", () => {
    expect(() => assertStatusTransition(baseSpec, "public")).toThrow(
      "Illegal status transition: draft->public"
    );
  });
});

