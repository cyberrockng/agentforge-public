import { describe, expect, it } from "vitest";
import { getTemplateGallery } from "./templates.js";

describe("template gallery", () => {
  it("exposes five truthful templates for founder personalization", () => {
    const gallery = getTemplateGallery();

    expect(gallery).toHaveLength(5);
    expect(gallery.map((item) => item.id)).toContain("launch-readiness-review");
    expect(gallery.find((item) => item.id === "launch-readiness-review")?.sourceLabel).toBe(
      "Launch Kit-derived"
    );
  });

  it("shows the personalization fields required before a template can become a founder draft", () => {
    const gallery = getTemplateGallery();

    for (const item of gallery) {
      expect(item.personalizationFields).toEqual([
        "Founder name",
        "Brand name",
        "Target customer",
        "Expertise area",
        "Service focus",
        "Founder boundaries",
        "Tone",
        "Pricing preference"
      ]);
    }
  });

  it("keeps templates out of fake traction claims", () => {
    const serialized = JSON.stringify(getTemplateGallery()).toLowerCase();

    expect(serialized).toContain("draft only");
    expect(serialized).not.toContain("guaranteed revenue");
    expect(serialized).not.toContain("approved by okx");
    expect(serialized).not.toContain("external founder win");
  });

});
