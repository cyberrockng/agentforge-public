import { z } from "zod";
import type { AgentSpec } from "./index.js";
import type { ModelClient } from "./model-client.js";

export const FounderInterviewInputSchema = z.object({
  founderName: z.string().min(1),
  expertiseArea: z.string().min(1),
  targetCustomer: z.string().min(1),
  servicesOffered: z.array(z.string().min(1)).min(1),
  boundaries: z.array(z.string().min(1)).min(1),
  tone: z.string().min(1),
  pricingPreference: z.string().min(1),
  brandName: z.string().min(1).optional()
});

export type FounderInterviewInput = z.infer<typeof FounderInterviewInputSchema>;

const AgentSpecDraftSchema = z.object({
  agent_name: z.string().min(1),
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
        required_inputs: z.array(z.string().min(1)).min(1),
        output_format: z.string().min(1)
      })
    )
    .min(1),
  boundaries: z.object({
    refusal_policy: z.array(z.string().min(1)).min(1),
    out_of_scope: z.array(z.string().min(1)).min(1)
  }),
  knowledge: z.object({
    facts: z.array(z.string().min(1)),
    documents: z.array(z.string())
  })
});

export type AgentSpecDraft = z.infer<typeof AgentSpecDraftSchema>;

export async function createAgentSpecDraft(
  input: FounderInterviewInput,
  modelClient: ModelClient
): Promise<AgentSpecDraft> {
  const parsed = FounderInterviewInputSchema.parse(input);

  return modelClient.generateStructured({
    schema: AgentSpecDraftSchema,
    system:
      [
        "You compile human expertise into a narrow, truthful AgentSpec draft.",
        "Never invent credentials, customers, revenue, receipts, endorsements, on-chain activity, or guarantees.",
        "Return only JSON with this exact shape:",
        "{",
        '  "agent_name": "string",',
        '  "category": "finance|software|lifestyle|art|education|business",',
        '  "persona": { "system_prompt": "string", "tone": "string", "bio": "string" },',
        '  "services": [{',
        '    "service_id": "snake_case_string",',
        '    "title": "string",',
        '    "description": "string",',
        '    "price_usdt": 15,',
        '    "required_inputs": ["string"],',
        '    "output_format": "string"',
        "  }],",
        '  "boundaries": { "refusal_policy": ["string"], "out_of_scope": ["string"] },',
        '  "knowledge": { "facts": ["string"], "documents": [] }',
        "}",
        "Use only the founder interview input as source material. Keep services practical and narrow."
      ].join("\n"),
    user: `Founder interview input:\n${JSON.stringify(parsed, null, 2)}`
  });
}

export function finalizeAgentSpecDraft(params: {
  id: string;
  founderId: string;
  slug: string;
  createdAt: string;
  draft: AgentSpecDraft;
}): AgentSpec {
  return {
    id: params.id,
    founder_id: params.founderId,
    slug: params.slug,
    created_at: params.createdAt,
    status: "draft",
    forge_gate: {
      passed: false,
      score: 0,
      report_id: null
    },
    ...params.draft
  };
}
