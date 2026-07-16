import { describe, expect, it } from "vitest";
import {
  assertTenantCatalogEntryStatusEvidence,
  findTenantCatalogEntry,
  listTenantCatalog
} from "./tenant-catalog.js";
import { listStorefrontTenants } from "../../../apps/web/src/lib/tenant-catalog.js";

describe("tenant catalog", () => {
  it("lists the real storefront tenants", () => {
    const tenants = listTenantCatalog();

    expect(tenants.map((tenant) => tenant.slug).sort()).toEqual(["forge", "launch-kit", "shieldcheck"]);
    expect(tenants.find((tenant) => tenant.slug === "forge")).toMatchObject({
      agentName: "AgentForge",
      status: "public",
      route: "/svc/forge"
    });
    expect(tenants.find((tenant) => tenant.slug === "launch-kit")).toMatchObject({
      agentName: "Launch Kit",
      status: "heartbeat",
      route: "/svc/launch-kit",
      proof: {
        forgeGateReportId: "fg_live_feb7a059bc064c78",
        ownHeartbeatTx: "0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a",
        ownHeartbeatServiceCallId: "sc_launch-kit_3b103d9976a5"
      }
    });
    expect(tenants.find((tenant) => tenant.slug === "shieldcheck")).toMatchObject({
      agentName: "ShieldCheck",
      founderName: "Abiola Apata",
      status: "softlaunch",
      route: "/svc/shieldcheck",
      proof: {
        forgeGateReportId: "fg_live_bcba01f18229cbbd",
        forgeGenesisTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
        birthCertificateId: "bc_shieldcheck_2026-07-13"
      }
    });
  });

  it("returns defensive copies", () => {
    const first = findTenantCatalogEntry("forge");

    expect(first).not.toBeNull();
    first?.knowledgeFacts.push("mutated");
    if (first?.proof) {
      first.proof.forgeGenesisTx = "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    expect(findTenantCatalogEntry("forge")?.knowledgeFacts).not.toContain("mutated");
    expect(findTenantCatalogEntry("forge")?.proof?.forgeGenesisTx).not.toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });

  it("validates visible tenant status against launch-ladder evidence", () => {
    for (const tenant of listTenantCatalog()) {
      expect(() => assertTenantCatalogEntryStatusEvidence(tenant)).not.toThrow();
    }
  });

  it("rejects softlaunch status without birth-certificate transition evidence", () => {
    const launchKit = findTenantCatalogEntry("launch-kit");

    if (!launchKit) {
      throw new Error("expected Launch Kit tenant");
    }

    expect(() =>
      assertTenantCatalogEntryStatusEvidence({
        ...launchKit,
        status: "softlaunch"
      })
    ).toThrow("heartbeat->softlaunch requires a birth certificate");
  });

  it("keeps the web storefront tenant catalog aligned with core status evidence", () => {
    const coreTenants = listTenantCatalog();
    const webTenants = listStorefrontTenants();

    expect(webTenants.map((tenant) => tenant.slug)).toEqual(coreTenants.map((tenant) => tenant.slug));
    expect(
      webTenants.map((tenant) => ({
        slug: tenant.slug,
        agentId: tenant.agentId,
        agentName: tenant.agentName,
        status: tenant.status,
        route: tenant.route,
        mcpRoute: tenant.mcpRoute,
        displayAmount: tenant.displayAmount,
        serviceTitle: tenant.service.title,
        forgeGateReportId: tenant.proof?.forgeGateReportId,
        ownHeartbeatServiceCallId: tenant.proof?.ownHeartbeatServiceCallId,
        birthCertificateId: tenant.proof?.birthCertificateId
      }))
    ).toEqual(
      coreTenants.map((tenant) => ({
        slug: tenant.slug,
        agentId: tenant.agentId,
        agentName: tenant.agentName,
        status: tenant.status,
        route: tenant.route,
        mcpRoute: tenant.mcpRoute,
        displayAmount: tenant.displayAmount,
        serviceTitle: tenant.service.title,
        forgeGateReportId: tenant.proof?.forgeGateReportId,
        ownHeartbeatServiceCallId: tenant.proof?.ownHeartbeatServiceCallId,
        birthCertificateId: tenant.proof?.birthCertificateId
      }))
    );
  });
});
