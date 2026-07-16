import { describe, expect, it } from "vitest";
import { compileAgentSpec } from "./compiler.js";
import { finalizeAgentSpecDraft } from "./interview.js";
import {
  createTemplateAgentSpecDraft,
  findForgeTemplate,
  listForgeTemplates,
  TemplateForgeInputSchema,
  type TemplateForgeInput
} from "./templates.js";
import { parseAgentSpec } from "./index.js";
import { getTemplateGallery } from "../../../apps/web/src/lib/templates.js";

const baseInput: TemplateForgeInput = {
  templateId: "launch-readiness-review",
  founderName: "Real Founder",
  brandName: "Founder Launch Desk",
  targetCustomer: "OKX.AI builders preparing a service update",
  expertiseArea: "launch reviews and service packaging",
  serviceFocus: "turning launch notes into a review-ready checklist",
  boundaries: ["Do not invent customer traction.", "Do not touch marketplace settings."],
  tone: "direct and practical",
  pricingPreference: "0.4 USDT while testing demand"
};

describe("forge templates", () => {
  it("ships exactly five founder-service templates including the Launch Kit-derived template", () => {
    const templates = listForgeTemplates();

    expect(templates).toHaveLength(5);
    expect(templates.map((template) => template.id)).toContain("launch-readiness-review");
    expect(findForgeTemplate("launch-readiness-review")?.source).toBe("launch-kit-derived");
  });

  it("defensively clones template lists", () => {
    const first = listForgeTemplates()[0];

    if (!first) {
      throw new Error("expected at least one template");
    }

    first.buyerInputs.push("mutated input");

    expect(listForgeTemplates()[0]?.buyerInputs).not.toContain("mutated input");
  });

  it("requires founder personalization fields", () => {
    expect(() =>
      TemplateForgeInputSchema.parse({
        templateId: "launch-readiness-review",
        founderName: "Real Founder"
      })
    ).toThrow();
  });

  it("creates a valid AgentSpec draft from founder personalization", () => {
    const draft = createTemplateAgentSpecDraft(baseInput);

    expect(draft.agent_name).toBe("Founder Launch Desk");
    expect(draft.services[0]?.price_usdt).toBe(0.4);
    expect(draft.persona.system_prompt).toContain(baseInput.targetCustomer);
    expect(draft.persona.system_prompt).toContain(baseInput.serviceFocus);
    expect(draft.boundaries.refusal_policy).toContain("Do not invent customer traction.");
    expect(draft.knowledge.facts).toContain("Template source: launch-kit-derived.");

    const spec = finalizeAgentSpecDraft({
      id: "agent_template_01",
      founderId: "founder_real_01",
      slug: "founder-launch-desk",
      createdAt: "2026-07-14T00:00:00.000Z",
      draft
    });

    expect(parseAgentSpec(spec).status).toBe("draft");
    expect(compileAgentSpec(spec).compiled_prompt).toContain("Template id: launch-readiness-review.");
  });

  it("rejects unknown template ids", () => {
    expect(() =>
      createTemplateAgentSpecDraft({
        ...baseInput,
        templateId: "unknown-template"
      })
    ).toThrow("Unknown template id: unknown-template");
  });

  it("keeps generated drafts inside the no-fake-claims boundary", () => {
    const draft = createTemplateAgentSpecDraft({
      ...baseInput,
      templateId: "evidence-pack-builder",
      brandName: "Proof Desk"
    });
    const serialized = JSON.stringify(draft).toLowerCase();

    expect(serialized).not.toContain("guaranteed revenue");
    expect(serialized).not.toContain("approved by okx");
    expect(serialized).not.toContain("verified customers");
    expect(serialized).toContain("without supplied evidence");
  });

  it("keeps the web template gallery in sync with the core registry", () => {
    const gallery = getTemplateGallery();
    const coreTemplates = listForgeTemplates();

    expect(gallery.map((item) => item.id)).toEqual(coreTemplates.map((template) => template.id));
    expect(
      gallery.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        summary: item.summary,
        buyerInputs: item.buyerInputs,
        outputFormat: item.outputFormat,
        boundaries: item.boundaries,
        displayPrice: item.displayPrice
      }))
    ).toEqual(
      coreTemplates.map((template) => ({
        id: template.id,
        title: template.title,
        category: template.category,
        summary: template.summary,
        buyerInputs: template.buyerInputs,
        outputFormat: template.outputFormat,
        boundaries: template.baseBoundaries,
        displayPrice: `${template.basePriceUsdt.toFixed(2)} USDT base`
      }))
    );
  });
});
