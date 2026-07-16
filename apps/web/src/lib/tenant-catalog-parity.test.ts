import { listTenantCatalog } from "../../../../packages/core/src/tenant-catalog";
import { describe, expect, it } from "vitest";
import { listStorefrontTenants } from "./tenant-catalog";

type CoreTenant = ReturnType<typeof listTenantCatalog>[number];
type WebTenant = ReturnType<typeof listStorefrontTenants>[number];

describe("storefront tenant catalog parity", () => {
  it("keeps web-visible tenant fields in sync with the core runtime catalog", () => {
    expect(listStorefrontTenants().map(webSurface)).toEqual(listTenantCatalog().map(coreSurface));
  });
});

function webSurface(tenant: WebTenant) {
  return normalize({
    slug: tenant.slug,
    agentId: tenant.agentId,
    founderName: tenant.founderName,
    agentName: tenant.agentName,
    category: tenant.category,
    status: tenant.status,
    route: tenant.route,
    mcpRoute: tenant.mcpRoute,
    displayAmount: tenant.displayAmount,
    service: tenant.service,
    persona: tenant.persona,
    refusalBoundaries: tenant.refusalBoundaries,
    proof: webProofSurface(tenant.proof)
  });
}

function coreSurface(tenant: CoreTenant) {
  return normalize({
    slug: tenant.slug,
    agentId: tenant.agentId,
    founderName: tenant.founderName,
    agentName: tenant.agentName,
    category: tenant.category,
    status: tenant.status,
    route: tenant.route,
    mcpRoute: tenant.mcpRoute,
    displayAmount: tenant.displayAmount,
    service: {
      title: tenant.service.title,
      description: tenant.service.description,
      requiredInputs: tenant.service.requiredInputs,
      outputFormat: tenant.service.outputFormat
    },
    persona: {
      summary: tenant.persona.summary
    },
    refusalBoundaries: tenant.refusalBoundaries,
    proof: webProofSurface(tenant.proof)
  });
}

function webProofSurface(proof: WebTenant["proof"] | CoreTenant["proof"]) {
  if (!proof) {
    return undefined;
  }

  return {
    forgeGateReportId: proof.forgeGateReportId,
    forgeGateEvidenceRef: proof.forgeGateEvidenceRef,
    forgeGenesisTx: proof.forgeGenesisTx,
    forgeGenesisEvidenceRef: proof.forgeGenesisEvidenceRef,
    consentEvidenceRef: proof.consentEvidenceRef,
    birthCertificateId: proof.birthCertificateId,
    birthCertificateAnchorTx: proof.birthCertificateAnchorTx,
    ownHeartbeatTx: proof.ownHeartbeatTx,
    ownHeartbeatEvidenceRef: proof.ownHeartbeatEvidenceRef,
    ownHeartbeatServiceCallId: proof.ownHeartbeatServiceCallId
  };
}

function normalize(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as unknown;
}
