import { getDashboardSummary, type DashboardSummaryOptions } from "./dashboard-ledger";
import { listStorefrontTenants, type TenantCatalogEntry } from "./tenant-catalog";
import { verificationRecords, type VerificationRecord } from "./verify-records";
import { statusLabel } from "./storefront";

export type GuildEvidenceLink = {
  label: string;
  href: string;
  recordId: string;
  recordType: VerificationRecord["recordType"];
};

export type GuildEntry = {
  slug: string;
  agentName: string;
  agentId: string;
  founderName: string;
  operatorLabel: string;
  serviceTitle: string;
  summary: string;
  statusLabel: string;
  profileHref: string;
  displayAmount: string;
  paidCalls: number;
  settled: string;
  evidenceLinks: GuildEvidenceLink[];
  caveats: string[];
};

export type GuildExcludedEntry = {
  slug: string;
  agentName: string;
  reason: string;
};

export type GuildSummary = {
  entries: GuildEntry[];
  excluded: GuildExcludedEntry[];
};

export async function getGuildSummary(options: DashboardSummaryOptions = {}): Promise<GuildSummary> {
  const tenants = listStorefrontTenants();
  const dashboard = await getDashboardSummary(options);
  const dashboardRows = new Map(dashboard.rows.map((row) => [row.slug, row]));
  const entries = tenants
    .map((tenant) => buildGuildEntry(tenant, dashboardRows.get(tenant.slug)))
    .filter((entry): entry is GuildEntry => entry !== null);

  const includedSlugs = new Set(entries.map((entry) => entry.slug));
  const excluded = tenants
    .filter((tenant) => !includedSlugs.has(tenant.slug))
    .map((tenant) => ({
      slug: tenant.slug,
      agentName: tenant.agentName,
      reason:
        tenant.slug === "launch-kit"
          ? "Softlaunch tenant with no published receipt/certificate record yet."
          : "No published verification record yet."
    }));

  return { entries, excluded };
}

function buildGuildEntry(
  tenant: TenantCatalogEntry,
  dashboardRow?: Awaited<ReturnType<typeof getDashboardSummary>>["rows"][number]
): GuildEntry | null {
  const evidenceRecords = findGuildEvidenceRecords(tenant);

  if (evidenceRecords.length === 0) {
    return null;
  }

  return {
    slug: tenant.slug,
    agentName: tenant.agentName,
    agentId: tenant.agentId,
    founderName: tenant.founderName ?? "AgentForge core",
    operatorLabel:
      tenant.slug === "forge"
        ? "Listed ASP / platform operator"
        : tenant.slug === "launch-kit"
          ? "Self-operated AgentForge proof tenant"
          : "Real founder agent",
    serviceTitle: tenant.service.title,
    summary: tenant.persona.summary,
    statusLabel: statusLabel(tenant.status),
    profileHref: `/a/${tenant.slug}`,
    displayAmount: tenant.displayAmount,
    paidCalls: dashboardRow?.paidCalls ?? 0,
    settled: dashboardRow?.settledAtomic ?? "0",
    evidenceLinks: evidenceRecords.map((record) => ({
      label: evidenceLabel(record),
      href: `/verify/${record.recordId}`,
      recordId: record.recordId,
      recordType: record.recordType
    })),
    caveats: caveatsForTenant(tenant)
  };
}

function findGuildEvidenceRecords(tenant: TenantCatalogEntry) {
  return verificationRecords.filter((record) => {
    if (record.agentId === tenant.agentId) {
      return true;
    }

    if (tenant.proof?.birthCertificateId === record.recordId) {
      return true;
    }

    return tenant.proof?.forgeGenesisTx ? record.aliases.includes(tenant.proof.forgeGenesisTx) : false;
  });
}

function evidenceLabel(record: VerificationRecord) {
  switch (record.recordType) {
    case "birth_certificate":
      return "Birth certificate";
    case "proof_of_service_receipt":
      return "Proof-of-service receipt";
  }
}

function caveatsForTenant(tenant: TenantCatalogEntry) {
  const caveats = [
    "Shown only because a real listing, founder consent, or published proof record exists."
  ];

  if (tenant.slug === "shieldcheck") {
    caveats.push("ShieldCheck passed its live Forge Gate and completed one real paid heartbeat; it remains controlled soft-launch, not a full public-launch guarantee.");
  }

  if (tenant.slug === "forge") {
    caveats.push("AgentForge receipt proves the paid forge service call, not a guarantee of OKX approval or customer revenue.");
  }

  if (tenant.slug === "launch-kit") {
    caveats.push("Launch Kit has one real paid proof call, but it is self-operated by AgentForge; it is not counted as an external founder or independent customer win.");
  }

  return caveats;
}
