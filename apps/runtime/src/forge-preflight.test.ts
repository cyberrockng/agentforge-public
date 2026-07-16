import { describe, expect, it } from "vitest";
import { buildForgePreflightInfo, buildForgePreflightResponse } from "./forge-preflight.js";
import { findTenant } from "./tenant-registry.js";

const tenant = findTenant("forge");

const input = {
  founderName: "Abiola's Buyer",
  expertiseArea: "OKX.AI listing hardening for paid agent services",
  targetCustomer: "builders preparing a public OKX.AI paid endpoint",
  servicesOffered: ["buyer intake review", "price and proof boundary check"],
  boundaries: ["no fake claims", "no private keys", "no guaranteed OKX approval"],
  tone: "direct and practical",
  pricingPreference: "0.40 USDT launch price",
  brandName: "ReviewReady"
};

describe("Forge preflight", () => {
  it("returns no-payment guidance with the exact normalized body for payment", () => {
    expect(tenant).not.toBeNull();

    const result = buildForgePreflightResponse({
      tenant: tenant!,
      endpoint: "https://runtime.example/svc/forge",
      preflightEndpoint: "https://runtime.example/svc/forge/preflight",
      input,
      quote: {
        id: "afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb",
        paidEndpoint: "https://runtime.example/svc/forge?af_quote=afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb",
        expiresAt: "2026-07-15T12:30:00.000Z",
        requestBodySha256: "b".repeat(64)
      }
    });

    expect(result.ok).toBe(true);
    expect(result.noPaymentAttempted).toBe(true);
    expect(result.bodyReadyForPayment).toBe(true);
    expect(result.service.price).toBe("0.40 USDT");
    expect(result.normalizedBody).toEqual(input);
    expect(result.quote.paidEndpoint).toContain("af_quote=");
    expect(result.quote.emptyReplayRecovery).toContain("replay");
    expect(JSON.parse(result.bodyJson)).toEqual(input);
    expect(result.commandTemplates.preflightCurl).toContain("/svc/forge/preflight");
    expect(result.commandTemplates.task402PayTemplate).toContain("--provider-agent-id 3746");
    expect(result.commandTemplates.task402PayTemplate).toContain("af_quote=");
    expect(result.commandTemplates.task402PayTemplate).toContain("--body");
    expect(result.commandTemplates.task402PayTemplate).toContain("'\"'\"'");
  });

  it("warns buyers about OKX task-flow review timing without creating fake proof", () => {
    expect(tenant).not.toBeNull();

    const result = buildForgePreflightInfo({
      tenant: tenant!,
      endpoint: "https://runtime.example/svc/forge",
      preflightEndpoint: "https://runtime.example/svc/forge/preflight",
      exampleRequestBody: input
    });

    const serialized = JSON.stringify(result).toLowerCase();

    expect(result.bodyReadyForPayment).toBe(false);
    expect(serialized).toContain("auto-review");
    expect(serialized).toContain("no payment");
    expect(serialized).not.toContain("guaranteed approval");
    expect(serialized).not.toContain("fake traction");
    expect(serialized).not.toContain("feedback-submit");
  });
});
