import { describe, expect, it } from "vitest";
import {
  agentForgeCheckout,
  bodyJson,
  exampleFounderCheckoutBody,
  preflightCurl,
  recoveryCurl,
  task402PayTemplate
} from "./agentforge-checkout";

describe("AgentForge buyer checkout", () => {
  it("points buyers to preflight before payment with the required body fields", () => {
    expect(agentForgeCheckout.okxAgentId).toBe("#3746");
    expect(agentForgeCheckout.price).toBe("0.40 USDT");
    expect(agentForgeCheckout.preflightEndpoint).toContain("/svc/forge/preflight");
    expect(agentForgeCheckout.recoveryEndpoint).toContain("/svc/forge/recovery");
    expect(agentForgeCheckout.runtimeEndpoint).toContain("/svc/forge");
    expect(agentForgeCheckout.requiredFields).toEqual([
      "founderName",
      "expertiseArea",
      "targetCustomer",
      "servicesOffered",
      "boundaries",
      "tone",
      "pricingPreference"
    ]);
  });

  it("keeps the same body in preflight and task-402-pay templates", () => {
    const body = {
      ...exampleFounderCheckoutBody,
      founderName: "Ada's Launch Team"
    };
    const json = bodyJson(body);

    expect(preflightCurl(body)).toContain(json.replace("Ada's", "Ada'\"'\"'s"));
    expect(task402PayTemplate(body)).toContain("--body");
    expect(task402PayTemplate(body)).toContain("af_quote=<QUOTE_ID_FROM_PREFLIGHT>");
    expect(task402PayTemplate(body)).toContain(json.replace("Ada's", "Ada'\"'\"'s"));
    expect(task402PayTemplate(body)).toContain("--provider-agent-id 3746");
  });

  it("builds a recovery command from the payment transaction and original body", () => {
    const body = {
      ...exampleFounderCheckoutBody,
      founderName: "Recovery Buyer"
    };
    const command = recoveryCurl("0x1111111111111111111111111111111111111111111111111111111111111111", body);

    expect(command).toContain("/svc/forge/recovery");
    expect(command).toContain("paymentTransaction");
    expect(command).toContain("0x1111111111111111111111111111111111111111111111111111111111111111");
    expect(command).toContain("originalBody");
    expect(command).toContain("Recovery Buyer");
  });

  it("warns about auto-review without scripting a review", () => {
    const serialized = JSON.stringify(agentForgeCheckout).toLowerCase();

    expect(serialized).toContain("auto-review");
    expect(serialized).toContain("af_quote");
    expect(serialized).toContain("quote-bound");
    expect(serialized).toContain("inspect the deliverable");
    expect(serialized).toContain("honest review");
    expect(serialized).toContain("deliverable response is lost");
    expect(serialized).not.toContain("feedback-submit");
    expect(serialized).not.toContain("guaranteed approval");
  });
});
