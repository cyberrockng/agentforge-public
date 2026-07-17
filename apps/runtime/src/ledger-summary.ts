import { checkLedgerJournal, type LedgerJournalRecord, type LedgerTransaction, type ServiceCall } from "@agentforge/payments";
import type { TenantRuntimeConfig } from "./tenant-registry.js";

export type RuntimeDashboardRow = {
  slug: string;
  label: string;
  founderLabel: string;
  status: string;
  paidCalls: number;
  settledAtomic: string;
  forgeRevenueAtomic: string;
  founderPayableAtomic: string;
  referralPayableAtomic: string;
};

export type RuntimeDashboardSummary = {
  generatedAt: string;
  source: string;
  paidCalls: number;
  settledAtomic: string;
  forgeRevenueAtomic: string;
  founderPayableAtomic: string;
  referralPayableAtomic: string;
  rows: RuntimeDashboardRow[];
  latestCall: ServiceCall | null;
};

export function buildRuntimeDashboardSummary(
  records: LedgerJournalRecord[],
  tenants: TenantRuntimeConfig[],
  generatedAt = new Date().toISOString(),
  source = "Runtime ledger journal"
): RuntimeDashboardSummary {
  const durableRecords = filterDurableEconomicRecords(records);
  const check = checkLedgerJournal(durableRecords);

  if (!check.ok) {
    throw new Error(`Ledger journal integrity check failed: ${check.errors.join("; ")}`);
  }

  const deliveredCalls = durableRecords
    .filter((record): record is Extract<LedgerJournalRecord, { type: "service_call" }> => record.type === "service_call")
    .map((record) => record.serviceCall)
    .filter((serviceCall) => serviceCall.status === "delivered");
  const ledgerTransactions = durableRecords
    .filter(
      (record): record is Extract<LedgerJournalRecord, { type: "ledger_transaction" }> =>
        record.type === "ledger_transaction"
    )
    .map((record) => record.ledgerTransaction);

  const rows = tenants.map((tenant) => {
    const tenantCalls = deliveredCalls.filter((call) => call.tenantSlug === tenant.slug);
    const tenantTransactions = ledgerTransactions.filter(
      (transaction) => transaction.metadata.tenantSlug === tenant.slug
    );

    return {
      slug: tenant.slug,
      label: tenant.agentName,
      founderLabel: tenant.founderName ?? "AgentForge core",
      status: runtimeStatusLabel(tenant, tenantCalls.length),
      paidCalls: tenantCalls.length,
      settledAtomic: sumAtomic(tenantCalls.map((call) => call.amountAtomic)),
      forgeRevenueAtomic: sumNetEntries(tenantTransactions, "revenue:forge:"),
      founderPayableAtomic: sumCreditEntries(tenantTransactions, "liability:founder:"),
      referralPayableAtomic: sumCreditEntries(tenantTransactions, "liability:referral:")
    };
  });

  return {
    generatedAt,
    source,
    paidCalls: deliveredCalls.length,
    settledAtomic: sumAtomic(deliveredCalls.map((call) => call.amountAtomic)),
    forgeRevenueAtomic: sumNetEntries(ledgerTransactions, "revenue:forge:"),
    founderPayableAtomic: sumCreditEntries(ledgerTransactions, "liability:founder:"),
    referralPayableAtomic: sumCreditEntries(ledgerTransactions, "liability:referral:"),
    rows,
    latestCall: latestDeliveredCall(deliveredCalls)
  };
}

export function filterDurableEconomicRecords(records: LedgerJournalRecord[]) {
  return records.filter((record) => record.type === "ledger_transaction" || record.serviceCall.status === "delivered");
}

function runtimeStatusLabel(tenant: TenantRuntimeConfig, paidCalls: number) {
  if (tenant.slug === "forge") {
    return "Public paid service";
  }

  if (tenant.slug === "shieldcheck") {
    return paidCalls > 0
      ? "Paid heartbeat complete; controlled soft-launch"
      : "Controlled heartbeat proof run; own paid heartbeat pending";
  }

  if (tenant.slug === "launch-kit") {
    return paidCalls > 0
      ? "Paid heartbeat complete; soft-launch transition pending"
      : "Live Forge Gate passed; paid heartbeat pending";
  }

  if (tenant.status === "softlaunch") {
    return "Controlled soft-launch";
  }

  return tenant.status;
}

function sumCreditEntries(transactions: LedgerTransaction[], accountPrefix: string) {
  return sumAtomic(
    transactions.flatMap((transaction) =>
      transaction.entries
        .filter((entry) => entry.direction === "credit" && entry.account.startsWith(accountPrefix))
        .map((entry) => entry.amountAtomic)
    )
  );
}

function sumNetEntries(transactions: LedgerTransaction[], accountPrefix: string) {
  return transactions
    .flatMap((transaction) => transaction.entries)
    .filter((entry) => entry.account.startsWith(accountPrefix))
    .reduce((total, entry) => {
      const amount = BigInt(entry.amountAtomic);
      return entry.direction === "credit" ? total + amount : total - amount;
    }, 0n)
    .toString();
}

function sumAtomic(values: string[]) {
  return values.reduce((total, value) => total + BigInt(value), 0n).toString();
}

function latestDeliveredCall(calls: ServiceCall[]) {
  return calls.reduce<ServiceCall | null>((latest, call) => {
    if (!latest) {
      return call;
    }

    const latestTime = Date.parse(latest.deliveredAt ?? latest.quotedAt ?? "");
    const callTime = Date.parse(call.deliveredAt ?? call.quotedAt ?? "");

    return Number.isFinite(callTime) && (!Number.isFinite(latestTime) || callTime >= latestTime) ? call : latest;
  }, null);
}
