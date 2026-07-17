import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listStorefrontTenants, type TenantCatalogEntry } from "./tenant-catalog";
import { runtimeOrigin } from "./storefront";

type ServiceCallStatus = "quoted" | "delivered";
type LedgerDirection = "debit" | "credit";

export type DashboardServiceCall = {
  id: string;
  tenantSlug: string;
  agentId: string;
  founderId: string;
  serviceId: string;
  status: ServiceCallStatus;
  amountAtomic: string;
  paymentTransaction: string | null;
  deliveredAt: string | null;
  ledgerTransactionId: string | null;
  referral?: {
    code: string;
    beneficiaryId: string;
  } | null;
};

type DashboardLedgerEntry = {
  account: string;
  direction: LedgerDirection;
  amountAtomic: string;
};

type DashboardLedgerTransaction = {
  id: string;
  serviceCallId: string;
  occurredAt: string;
  entries: DashboardLedgerEntry[];
  metadata: {
    tenantSlug: string;
    founderId: string;
    splitPolicy: {
      founderBps: number;
      forgeBps: number;
    };
    referral?: {
      code: string;
      beneficiaryId: string;
      bps: number;
      basis: "forge_share";
      amountAtomic: string;
    } | null;
  };
};

type DashboardLedgerJournalRecord =
  | {
      type: "service_call";
      recordedAt: string;
      serviceCall: DashboardServiceCall;
    }
  | {
      type: "ledger_transaction";
      recordedAt: string;
      ledgerTransaction: DashboardLedgerTransaction;
    };

type TenantDashboardState = {
  slug: string;
  label: string;
  founderLabel: string;
  status: string;
};

export type TenantDashboardRow = TenantDashboardState & {
  paidCalls: number;
  settledAtomic: string;
  forgeRevenueAtomic: string;
  founderPayableAtomic: string;
  referralPayableAtomic: string;
};

export type DashboardSummary = {
  generatedAt: string;
  source: string;
  paidCalls: number;
  settledAtomic: string;
  forgeRevenueAtomic: string;
  founderPayableAtomic: string;
  referralPayableAtomic: string;
  rows: TenantDashboardRow[];
  latestCall: DashboardServiceCall | null;
};

export type DashboardSummaryOptions = {
  allowRuntime?: boolean;
  fetcher?: typeof fetch;
  runtimeUrl?: string;
};

export async function getDashboardSummary(options: DashboardSummaryOptions = {}): Promise<DashboardSummary> {
  if (options.allowRuntime !== false) {
    const runtimeSummary = await tryReadRuntimeDashboardSummary(options);

    if (runtimeSummary) {
      return runtimeSummary;
    }
  }

  return getCommittedDashboardSummary();
}

export function getCommittedDashboardSummary(): DashboardSummary {
  return buildDashboardSummaryFromJournal(
    readCommittedLedgerJournal(),
    "Committed JSONL ledger journal fallback",
    "2026-07-13T00:00:00.000Z"
  );
}

export function formatUsdt(amountAtomic: string) {
  const value = BigInt(amountAtomic);
  const whole = value / 1_000_000n;
  const fractional = (value % 1_000_000n).toString().padStart(6, "0");

  return `${whole.toString()}.${fractional} USDT`;
}

async function tryReadRuntimeDashboardSummary(options: DashboardSummaryOptions) {
  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!fetcher) {
    return null;
  }

  try {
    const response = await fetcher(`${options.runtimeUrl ?? runtimeOrigin}/ledger/summary`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return normalizeDashboardSummary(await response.json());
  } catch {
    return null;
  }
}

function normalizeDashboardSummary(input: unknown): DashboardSummary {
  const summary = input as DashboardSummary;

  return {
    ...summary,
    referralPayableAtomic: summary.referralPayableAtomic ?? "0",
    rows: summary.rows.map((row) => ({
      ...row,
      referralPayableAtomic: row.referralPayableAtomic ?? "0"
    }))
  };
}

function buildDashboardSummaryFromJournal(
  records: DashboardLedgerJournalRecord[],
  source: string,
  generatedAt = new Date().toISOString()
): DashboardSummary {
  const tenants = listStorefrontTenants();
  const serviceCalls = records
    .filter((record): record is Extract<DashboardLedgerJournalRecord, { type: "service_call" }> => {
      return record.type === "service_call";
    })
    .map((record) => record.serviceCall);
  const ledgerTransactions = records
    .filter((record): record is Extract<DashboardLedgerJournalRecord, { type: "ledger_transaction" }> => {
      return record.type === "ledger_transaction";
    })
    .map((record) => record.ledgerTransaction);
  const deliveredCalls = serviceCalls.filter((call) => call.status === "delivered");
  const rows = tenants.map((tenant) => {
    const tenantCalls = deliveredCalls.filter((call) => call.tenantSlug === tenant.slug);
    const tenantTransactions = ledgerTransactions.filter(
      (transaction) => transaction.metadata.tenantSlug === tenant.slug
    );

    return {
      ...tenantDashboardState(tenant, tenantCalls.length),
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

function readCommittedLedgerJournal() {
  const path = findCommittedLedgerPath();
  const content = readFileSync(path, "utf8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as DashboardLedgerJournalRecord);
}

function findCommittedLedgerPath() {
  const relativePath = "ops/evidence/2026-07-13-t32-service-ledger.jsonl";
  const candidates = [
    join(process.cwd(), relativePath),
    join(process.cwd(), "..", "..", relativePath)
  ];
  const path = candidates.find((candidate) => existsSync(candidate));

  if (!path) {
    throw new Error(`Committed ledger journal not found at ${candidates.join(" or ")}`);
  }

  return path;
}

function tenantDashboardState(tenant: TenantCatalogEntry, paidCalls = 0): TenantDashboardState {
  return {
    slug: tenant.slug,
    label: tenant.agentName,
    founderLabel: tenant.founderName ?? "AgentForge core",
    status: tenantStatusCopy(tenant, paidCalls)
  };
}

function tenantStatusCopy(tenant: TenantCatalogEntry, paidCalls: number) {
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

function sumCreditEntries(transactions: DashboardLedgerTransaction[], accountPrefix: string) {
  return sumAtomic(
    transactions.flatMap((transaction) =>
      transaction.entries
        .filter((entry) => entry.direction === "credit" && entry.account.startsWith(accountPrefix))
        .map((entry) => entry.amountAtomic)
    )
  );
}

function sumNetEntries(transactions: DashboardLedgerTransaction[], accountPrefix: string) {
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

function latestDeliveredCall(calls: DashboardServiceCall[]) {
  return calls.reduce<DashboardServiceCall | null>((latest, call) => {
    if (!latest) {
      return call;
    }

    const latestTime = Date.parse(latest.deliveredAt ?? "");
    const callTime = Date.parse(call.deliveredAt ?? "");

    return Number.isFinite(callTime) && (!Number.isFinite(latestTime) || callTime >= latestTime) ? call : latest;
  }, null);
}
