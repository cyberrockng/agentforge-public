import { createHash } from "node:crypto";
import { z } from "zod";
import { AgentStatusSchema } from "./status-machine.js";

export { createAgentSpecDraft, finalizeAgentSpecDraft, FounderInterviewInputSchema } from "./interview.js";
export { createAnthropicModelClient } from "./anthropic-client.js";
export { compileAgentSpec } from "./compiler.js";
export {
  assertFounderActivationReady,
  evaluateFounderActivation,
  FounderActivationPacketSchema,
  FounderConsentSchema,
  HeartbeatProofSchema
} from "./founder-activation.js";
export { applyForgeGate, createDefaultForgeGateProbes, runForgeGate, runLiveForgeGate } from "./forge-gate.js";
export { assertProductionModelClient } from "./model-client.js";
export { assertTenantCatalogEntryStatusEvidence, findTenantCatalogEntry, listTenantCatalog } from "./tenant-catalog.js";
export { AgentStatusSchema, assertStatusTransition } from "./status-machine.js";
export {
  createTemplateAgentSpecDraft,
  findForgeTemplate,
  ForgeTemplateSchema,
  ForgeTemplateSourceSchema,
  listForgeTemplates,
  TemplateForgeInputSchema
} from "./templates.js";
export type { RuntimeTenantConfig } from "./compiler.js";
export type {
  FounderActivationDecision,
  FounderActivationPacket,
  FounderConsent,
  HeartbeatProof
} from "./founder-activation.js";
export type {
  ForgeGateFinding,
  ForgeGateProbe,
  ForgeGateProbeCategory,
  ForgeGateProbeAssertions,
  ForgeGateReport,
  LiveForgeGateReport,
  LiveForgeGateTranscript,
  RunLiveForgeGateOptions
} from "./forge-gate.js";
export type { AnthropicModelClientOptions } from "./anthropic-client.js";
export type { AgentSpecDraft, FounderInterviewInput } from "./interview.js";
export type { AgentStatus, TransitionContext, StatusTransitionSubject } from "./status-machine.js";
export type { ModelClient, ModelStructuredRequest } from "./model-client.js";
export type { TenantCatalogEntry, TenantCategory, TenantKind, TenantStatus } from "./tenant-catalog.js";
export type { ForgeTemplate, ForgeTemplateSource, TemplateForgeInput } from "./templates.js";

export const AgentSpecSchema = z.object({
  id: z.string().min(1),
  founder_id: z.string().min(1),
  agent_name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(["finance", "software", "lifestyle", "art", "education", "business"]),
  persona: z.object({
    system_prompt: z.string().min(1),
    tone: z.string().min(1),
    bio: z.string().min(1)
  }),
  services: z
    .array(
      z.object({
        service_id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        price_usdt: z.number().nonnegative(),
        required_inputs: z.array(z.string().min(1)),
        output_format: z.string().min(1)
      })
    )
    .min(1),
  boundaries: z.object({
    refusal_policy: z.array(z.string().min(1)),
    out_of_scope: z.array(z.string().min(1))
  }),
  knowledge: z.object({
    facts: z.array(z.string().min(1)),
    documents: z.array(z.string().min(1))
  }),
  status: AgentStatusSchema,
  forge_gate: z.object({
    passed: z.boolean(),
    score: z.number().min(0).max(100),
    report_id: z.string().min(1).nullable()
  }),
  created_at: z.string().datetime()
});

export type AgentSpec = z.infer<typeof AgentSpecSchema>;

export function parseAgentSpec(input: unknown): AgentSpec {
  return AgentSpecSchema.parse(input);
}

export function canonicalJson(input: unknown): string {
  return JSON.stringify(sortForCanonicalJson(input));
}

export function agentSpecHash(spec: AgentSpec): string {
  return createHash("sha256").update(canonicalJson(parseAgentSpec(spec))).digest("hex");
}

function sortForCanonicalJson(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(sortForCanonicalJson);
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, sortForCanonicalJson(value)])
    );
  }

  return input;
}
