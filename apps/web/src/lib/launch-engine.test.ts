import { describe, expect, it } from "vitest";
import { assertLaunchDraftEvidence, getLaunchEngine } from "./launch-engine";

describe("X Launch Engine", () => {
  it("creates founder-editable drafts for evidence-backed AgentForge agents only", () => {
    const engine = getLaunchEngine();

    expect(engine.humanPublishRequired).toBe(true);
    expect(engine.drafts.map((draft) => draft.slug)).toEqual(["forge", "shieldcheck", "launch-kit"]);

    for (const draft of engine.drafts) {
      expect(draft.status).toBe("ready_for_founder_edit");
      expect(draft.postText).toContain("#OKXAI");
      expect(draft.profileHref).toBe(`/a/${draft.slug}`);
      expect(draft.proofLinks.length).toBeGreaterThan(0);
      expect(() => assertLaunchDraftEvidence(draft)).not.toThrow();
    }
  });

  it("keeps each primary X draft inside the 280-character hard limit", () => {
    for (const draft of getLaunchEngine().drafts) {
      expect(draft.characterCount).toBeLessThanOrEqual(280);
    }
  });

  it("does not claim reviews or external-founder traction that do not exist", () => {
    const engine = getLaunchEngine();
    const postText = engine.drafts.map((draft) => draft.postText).join("\n").toLowerCase();

    expect(engine.reviewCount).toBe(0);
    expect(postText).not.toContain("verified reviews");
    expect(postText).not.toContain("customer reviews recorded");
    expect(postText).not.toContain("founders #2");
    expect(postText).not.toContain("guaranteed okx approval");
    expect(engine.globalRules.join(" ").toLowerCase()).toContain("do not claim cross-test reviews");
  });

  it("marks publishing as human-only", () => {
    const engine = getLaunchEngine();

    expect(engine.globalRules).toContain("Human publishes manually; AgentForge does not post to X.");
  });

  it("points the primary AgentForge launch draft at the public judge bundle", () => {
    const forgeDraft = getLaunchEngine().drafts.find((draft) => draft.slug === "forge");

    expect(forgeDraft?.postText).toContain("/judges");
    expect(forgeDraft?.postText).toContain("recovery hardening");
  });
});
