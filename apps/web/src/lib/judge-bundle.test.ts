import { describe, expect, it } from "vitest";
import { assertNoInternalPublicLinks, getJudgeBundle } from "./judge-bundle";
import { getProofLogEntries } from "./proof-log";

describe("judge bundle", () => {
  it("assembles the required public proof chain without internal planning links", async () => {
    const bundle = await getJudgeBundle({ allowRuntime: false });

    expect(bundle.listing.agentId).toBe("#3746");
    expect(bundle.primaryLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining(["/guild", "/dashboard", "/proof-log", "/launch-engine"])
    );
    expect(bundle.receiptSamples.map((receipt) => receipt.recordId)).toEqual(
      expect.arrayContaining([
        "bc_shieldcheck_2026-07-13",
        "psr_forge_b8f8787c7c13",
        "psr_shieldcheck_642e7372000a",
        "psr_launch-kit_3b103d9976a5"
      ])
    );
    expect(bundle.doNotClaim.join(" ")).toContain("external founders remain 0");
    expect(bundle.doNotClaim.join(" ")).toContain("customer-specific vulnerability findings");
    expect(bundle.submissionHandoff.xPostDraft).toContain("#OKXAI");
    expect(bundle.submissionHandoff.xPostDraft.length).toBeLessThanOrEqual(280);
    expect(bundle.submissionHandoff.googleFormNotes.join(" ")).toContain("/judges");
    expect(() => assertNoInternalPublicLinks(bundle)).not.toThrow();
  });

  it("keeps proof-log entries public-facing and caveated", () => {
    const entries = getProofLogEntries();

    expect(entries.length).toBeGreaterThanOrEqual(9);
    expect(entries.map((entry) => entry.date)).toEqual(
      expect.arrayContaining([
        "2026-07-06",
        "2026-07-07",
        "2026-07-08",
        "2026-07-09",
        "2026-07-10",
        "2026-07-11",
        "2026-07-12",
        "2026-07-13",
        "2026-07-14",
        "2026-07-16"
      ])
    );
    expect(entries.some((entry) => entry.links.some((link) => link.href === "/judges"))).toBe(true);
    expect(entries.every((entry) => entry.links.length > 0)).toBe(true);
    expect(entries.map((entry) => entry.caveat).join(" ")).toContain("self-operated proof call");
    expect(entries.map((entry) => entry.caveat).join(" ")).toContain("customer-specific security findings");
    expect(entries.flatMap((entry) => entry.links).some((link) => link.href.includes("ops/"))).toBe(false);
  });
});
