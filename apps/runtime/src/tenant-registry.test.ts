import { describe, expect, it } from "vitest";
import {
  buildTenantPaymentRoutes,
  findTenant,
  getTenantMeter,
  isTenantCallable,
  listTenants,
  recordTenantDelivery,
  recordTenantPayment,
  recordTenantQuote
} from "./tenant-registry.js";
import { buildLaunchKitDeliverable, LaunchKitInputSchema } from "./launch-kit.js";

describe("tenant registry", () => {
  it("exposes isolated tenant configs by slug", () => {
    const forge = findTenant("forge");
    const launchKit = findTenant("launch-kit");
    const shieldCheck = findTenant("shieldcheck");

    expect(forge?.kind).toBe("business-builder");
    expect(launchKit?.kind).toBe("launch-kit");
    expect(shieldCheck?.kind).toBe("security-review");
    expect(forge?.slug).not.toBe(launchKit?.slug);
    expect(shieldCheck?.founderName).toBe("Abiola Apata");
    expect(forge?.knowledgeFacts.join(" ")).not.toContain("ASPs cannot be deleted");
    expect(launchKit?.knowledgeFacts.join(" ")).toContain("ASPs cannot be deleted");
    expect(shieldCheck?.knowledgeFacts.join(" ")).toContain("paid call to AgentForge's forge service");
  });

  it("returns defensive copies so callers cannot mutate another tenant", () => {
    const first = findTenant("launch-kit");

    expect(first).not.toBeNull();
    first?.knowledgeFacts.push("mutated outside the registry");

    const second = findTenant("launch-kit");
    expect(second?.knowledgeFacts).not.toContain("mutated outside the registry");
  });

  it("meters tenant usage independently", () => {
    const beforeForge = getTenantMeter("forge");
    const beforeLaunchKit = getTenantMeter("launch-kit");

    recordTenantQuote("forge");
    recordTenantPayment("forge");
    recordTenantDelivery("forge", "2026-07-06T20:00:00.000Z");

    expect(getTenantMeter("forge")).toMatchObject({
      quoted: (beforeForge?.quoted ?? 0) + 1,
      paid: (beforeForge?.paid ?? 0) + 1,
      delivered: (beforeForge?.delivered ?? 0) + 1,
      lastDeliveredAt: "2026-07-06T20:00:00.000Z"
    });
    expect(getTenantMeter("launch-kit")).toEqual(beforeLaunchKit);
  });

  it("builds a GET and POST x402 payment route per callable tenant", () => {
    // GET must be registered too: x402 validity probes issue a bare unauthenticated GET and
    // expect a 402 challenge back, not a friendly 200 info page (that page now lives at
    // /svc/<slug>/info instead).
    const routes = buildTenantPaymentRoutes("0xfc9b58e81bce27c2f46558d501228d935f93e802");
    const routeEntries = routes as Record<string, { accepts: { extra: unknown } }>;

    expect(Object.keys(routes).sort()).toEqual([
      "GET /svc/forge",
      "GET /svc/shieldcheck",
      "POST /svc/forge",
      "POST /svc/shieldcheck"
    ]);
    expect(routeEntries["POST /svc/forge"]?.accepts.extra).toMatchObject({ tenantSlug: "forge" });
    expect(routeEntries["GET /svc/forge"]?.accepts.extra).toMatchObject({ tenantSlug: "forge" });
    expect(routeEntries["POST /svc/shieldcheck"]?.accepts.extra).toMatchObject({ tenantSlug: "shieldcheck" });
    expect(routeEntries["GET /svc/shieldcheck"]?.accepts.extra).toMatchObject({ tenantSlug: "shieldcheck" });
    expect(routeEntries["POST /svc/launch-kit"]).toBeUndefined();
    expect(routeEntries["GET /svc/launch-kit"]).toBeUndefined();
  });

  it("keeps only public and softlaunch tenants callable", () => {
    const shieldCheck = findTenant("shieldcheck");
    const forge = findTenant("forge");
    const launchKit = findTenant("launch-kit");

    expect(shieldCheck).not.toBeNull();
    expect(shieldCheck?.status).toBe("softlaunch");
    expect(launchKit?.status).toBe("heartbeat");
    expect(isTenantCallable(shieldCheck!)).toBe(true);
    expect(isTenantCallable(forge!)).toBe(true);
    expect(isTenantCallable(launchKit!)).toBe(false);
  });

  it("keeps launch-kit output scoped to launch readiness", () => {
    const tenant = findTenant("launch-kit");
    const input = LaunchKitInputSchema.parse({
      projectName: "ReviewReady",
      listingStatus: "draft",
      serviceDescription:
        "Reviews ASP listing copy and checks that the endpoint or responder matches what the listing promises.",
      endpointOrDeliveryPath: "https://example.com/svc/reviewready with x402 exact enabled",
      blockerOrFeedback: "Need a pre-review checklist."
    });

    expect(tenant).not.toBeNull();
    const deliverable = buildLaunchKitDeliverable(tenant!, input);

    expect(deliverable.verdict).toBe("ready-with-caveats");
    expect(deliverable.proofBundle).toContain("One successful real call or message transcript");
    expect(deliverable.delistingRecovery).toContain(
      "Reduce claims to what a reviewer can personally observe in a clean session."
    );
    expect(deliverable.aspRegistrationPackage.suggestedFee).toBe("0.45 USDT");
    expect(deliverable.boundaries).toContain("Do not guarantee OKX approval.");
  });

  it("requires observable paid or always-on readiness before launch-kit marks a package ready", () => {
    const tenant = findTenant("launch-kit");
    const input = LaunchKitInputSchema.parse({
      projectName: "LocalOnly",
      listingStatus: "draft",
      serviceDescription:
        "Claims to review ASP listing copy and readiness but only describes a private localhost demo.",
      endpointOrDeliveryPath: "http://localhost:3000/svc/localonly",
      blockerOrFeedback: "Reviewer cannot reach the service."
    });

    expect(tenant).not.toBeNull();
    const deliverable = buildLaunchKitDeliverable(tenant!, input);

    expect(deliverable.verdict).toBe("not-ready");
    expect(deliverable.checks).toContainEqual(
      expect.objectContaining({
        name: "Public delivery path",
        status: "fix"
      })
    );
    expect(deliverable.repairPlan).toContain(
      "Verify the endpoint or responder from a clean session before review; do not rely on localhost or a logged-in browser."
    );
  });

  it("lists the two T-B tenants without cross-talk", () => {
    const tenants = listTenants();

    expect(tenants.map((tenant) => tenant.slug).sort()).toEqual(["forge", "launch-kit", "shieldcheck"]);
    expect(tenants.find((tenant) => tenant.slug === "forge")?.service.title).toBe("AI Agent Business Builder");
    expect(tenants.find((tenant) => tenant.slug === "launch-kit")?.service.title).toBe("OKX.AI Launch Kit");
    expect(tenants.find((tenant) => tenant.slug === "launch-kit")?.status).toBe("heartbeat");
    expect(tenants.find((tenant) => tenant.slug === "shieldcheck")?.status).toBe("softlaunch");
  });
});
