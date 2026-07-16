import { describe, expect, it } from "vitest";
import { getGuildSummary } from "./guild.js";

describe("guild summary", () => {
  it("publishes only agents with verification records", async () => {
    const summary = await getGuildSummary({ allowRuntime: false });

    expect(summary.entries.map((entry) => entry.slug)).toEqual(["forge", "shieldcheck", "launch-kit"]);
    expect(summary.excluded.map((entry) => entry.slug)).not.toContain("launch-kit");
  });

  it("links every published entry to at least one verifier record", async () => {
    const summary = await getGuildSummary({ allowRuntime: false });

    for (const entry of summary.entries) {
      expect(entry.profileHref).toBe(`/a/${entry.slug}`);
      expect(entry.evidenceLinks.length).toBeGreaterThan(0);
      expect(entry.evidenceLinks.every((link) => link.href.startsWith("/verify/"))).toBe(true);
    }
  });

  it("keeps ShieldCheck in controlled soft-launch and tied to certificate evidence", async () => {
    const shieldCheck = (await getGuildSummary({ allowRuntime: false })).entries.find(
      (entry) => entry.slug === "shieldcheck"
    );

    expect(shieldCheck?.statusLabel).toBe("Soft-launch");
    expect(shieldCheck?.evidenceLinks.some((link) => link.recordId === "bc_shieldcheck_2026-07-13")).toBe(
      true
    );
    expect(shieldCheck?.evidenceLinks.some((link) => link.recordId === "psr_shieldcheck_642e7372000a")).toBe(true);
    expect(shieldCheck?.caveats.join(" ")).toContain("completed one real paid heartbeat");
  });

  it("keeps AgentForge tied to the service receipt", async () => {
    const forge = (await getGuildSummary({ allowRuntime: false })).entries.find(
      (entry) => entry.slug === "forge"
    );

    expect(forge?.statusLabel).toBe("Public");
    expect(forge?.evidenceLinks.some((link) => link.recordId === "psr_forge_b8f8787c7c13")).toBe(true);
    expect(forge?.paidCalls).toBe(1);
  });

  it("keeps Launch Kit included only as self-operated proof", async () => {
    const launchKit = (await getGuildSummary({ allowRuntime: false })).entries.find(
      (entry) => entry.slug === "launch-kit"
    );

    expect(launchKit?.statusLabel).toBe("Heartbeat");
    expect(launchKit?.operatorLabel).toBe("Self-operated AgentForge proof tenant");
    expect(launchKit?.evidenceLinks.some((link) => link.recordId === "psr_launch-kit_3b103d9976a5")).toBe(true);
    expect(launchKit?.paidCalls).toBe(1);
    expect(launchKit?.caveats.join(" ")).toContain("not counted as an external founder");
  });
});
