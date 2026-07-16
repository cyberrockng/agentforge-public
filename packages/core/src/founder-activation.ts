import { z } from "zod";
import type { AgentSpec } from "./index.js";

const ActivationAgentStatusSchema = z.enum([
  "draft",
  "gated",
  "heartbeat",
  "softlaunch",
  "public",
  "suspended"
]);

const ActivationAgentSpecSchema: z.ZodType<AgentSpec> = z.object({
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
  status: ActivationAgentStatusSchema,
  forge_gate: z.object({
    passed: z.boolean(),
    score: z.number().min(0).max(100),
    report_id: z.string().min(1).nullable()
  }),
  created_at: z.string().datetime()
});

const TransactionHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
  message: "Expected a 32-byte transaction hash"
});

export const FounderConsentSchema = z.object({
  founder_id: z.string().min(1),
  founder_name: z.string().min(1),
  consented_at: z.string().datetime(),
  evidence_ref: z.string().min(1),
  may_publish_agent_page: z.boolean(),
  may_use_founder_name: z.boolean()
});

export const HeartbeatProofSchema = z.object({
  payment_ref: z.string().min(1),
  transaction: TransactionHashSchema,
  network: z.string().min(1),
  amount_usdt: z.number().positive(),
  evidence_ref: z.string().min(1)
});

export const FounderActivationPacketSchema = z.object({
  spec: ActivationAgentSpecSchema,
  consent: FounderConsentSchema,
  heartbeat: HeartbeatProofSchema
});

export type FounderConsent = z.infer<typeof FounderConsentSchema>;
export type HeartbeatProof = z.infer<typeof HeartbeatProofSchema>;
export type FounderActivationPacket = z.infer<typeof FounderActivationPacketSchema>;

export type FounderActivationDecision = {
  ready: boolean;
  blockers: string[];
  agent: {
    id: string;
    slug: string;
    name: string;
    founderId: string;
    status: AgentSpec["status"];
  } | null;
};

export function evaluateFounderActivation(input: unknown): FounderActivationDecision {
  const packet = FounderActivationPacketSchema.safeParse(input);

  if (!packet.success) {
    return {
      ready: false,
      blockers: packet.error.issues.map((issue) => `${issue.path.join(".") || "packet"}: ${issue.message}`),
      agent: null
    };
  }

  const { spec, consent } = packet.data;
  const blockers: string[] = [];

  if (spec.founder_id !== consent.founder_id) {
    blockers.push("Founder consent does not match the AgentSpec founder_id.");
  }

  if (!consent.may_publish_agent_page) {
    blockers.push("Founder has not consented to a public agent page.");
  }

  if (!consent.may_use_founder_name) {
    blockers.push("Founder has not consented to using their name in the agent material.");
  }

  if (!spec.forge_gate.passed || spec.forge_gate.score < 80 || !spec.forge_gate.report_id) {
    blockers.push("AgentSpec has not passed Forge Gate with report evidence.");
  }

  if (spec.status !== "heartbeat") {
    blockers.push("AgentSpec must be in heartbeat status after a real paid heartbeat proof is applied.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    agent: {
      id: spec.id,
      slug: spec.slug,
      name: spec.agent_name,
      founderId: spec.founder_id,
      status: spec.status
    }
  };
}

export function assertFounderActivationReady(input: unknown): FounderActivationPacket {
  const packet = FounderActivationPacketSchema.parse(input);
  const decision = evaluateFounderActivation(packet);

  if (!decision.ready) {
    throw new Error(`Founder activation is not ready: ${decision.blockers.join(" ")}`);
  }

  return packet;
}
