import { describe, expect, it } from "vitest";
import { buildPaidServiceCallAccounting, buildQuotedServiceCall, type LedgerJournalRecord } from "@agentforge/payments";
import { buildRuntimeDashboardSummary } from "./ledger-summary.js";
import { listTenants } from "./tenant-registry.js";

describe("runtime ledger summary", () => {
  it("summarizes delivered calls from journal records", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z"
    });
    const records: LedgerJournalRecord[] = [
      {
        type: "service_call",
        recordedAt: "2026-07-13T00:00:01.000Z",
        serviceCall: accounting.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-13T00:00:01.000Z",
        ledgerTransaction: accounting.ledgerTransaction
      }
    ];

    const summary = buildRuntimeDashboardSummary(records, listTenants(), "2026-07-14T00:00:00.000Z");

    expect(summary.source).toBe("Runtime ledger journal");
    expect(summary.paidCalls).toBe(1);
    expect(summary.settledAtomic).toBe("1000000");
    expect(summary.latestCall?.id).toBe("sc_forge_b8f8787c7c13");
    expect(summary.rows.find((row) => row.slug === "forge")).toMatchObject({
      paidCalls: 1,
      settledAtomic: "1000000",
      forgeRevenueAtomic: "1000000",
      referralPayableAtomic: "0"
    });
    expect(summary.rows.find((row) => row.slug === "shieldcheck")).toMatchObject({
      paidCalls: 0,
      settledAtomic: "0"
    });
  });

  it("ignores legacy quoted rows when summarizing durable economic activity", () => {
    const quoted = buildQuotedServiceCall({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      network: "eip155:196",
      quotedAt: "2026-07-14T13:38:14.965Z",
      quoteNonce: "legacy-collision"
    });
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "400000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0x7777777777777777777777777777777777777777777777777777777777777777",
      network: "eip155:196",
      occurredAt: "2026-07-14T00:00:00.000Z"
    });
    const records: LedgerJournalRecord[] = [
      {
        type: "service_call",
        recordedAt: "2026-07-14T13:38:14.965Z",
        serviceCall: quoted
      },
      {
        type: "service_call",
        recordedAt: "2026-07-14T13:38:14.966Z",
        serviceCall: quoted
      },
      {
        type: "service_call",
        recordedAt: "2026-07-14T13:39:00.000Z",
        serviceCall: accounting.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-14T13:39:00.000Z",
        ledgerTransaction: accounting.ledgerTransaction
      }
    ];

    const summary = buildRuntimeDashboardSummary(records, listTenants(), "2026-07-14T14:00:00.000Z");

    expect(summary.paidCalls).toBe(1);
    expect(summary.settledAtomic).toBe("400000");
    expect(summary.latestCall?.id).toBe(accounting.serviceCall.id);
  });

  it("selects the latest delivered call by delivery timestamp instead of append order", () => {
    const older = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z"
    });
    const newer = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "400000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      network: "eip155:196",
      occurredAt: "2026-07-14T18:00:00.000Z"
    });
    const records: LedgerJournalRecord[] = [
      {
        type: "service_call",
        recordedAt: "2026-07-14T18:00:00.000Z",
        serviceCall: newer.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-14T18:00:00.000Z",
        ledgerTransaction: newer.ledgerTransaction
      },
      {
        type: "service_call",
        recordedAt: "2026-07-17T00:00:00.000Z",
        serviceCall: older.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-17T00:00:00.000Z",
        ledgerTransaction: older.ledgerTransaction
      }
    ];

    const summary = buildRuntimeDashboardSummary(
      records,
      listTenants(),
      "2026-07-17T00:00:00.000Z",
      "Runtime Postgres ledger journal"
    );

    expect(summary.source).toBe("Runtime Postgres ledger journal");
    expect(summary.latestCall?.id).toBe(newer.serviceCall.id);
  });

  it("nets referral credits out of Forge revenue and exposes referral payable", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "400000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0x3333333333333333333333333333333333333333333333333333333333333333",
      network: "eip155:196",
      occurredAt: "2026-07-14T00:00:00.000Z",
      referralAttribution: {
        code: "shieldcheck-founder",
        beneficiaryId: "founder-abiola-apata"
      }
    });
    const records: LedgerJournalRecord[] = [
      {
        type: "service_call",
        recordedAt: "2026-07-14T00:00:01.000Z",
        serviceCall: accounting.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-14T00:00:01.000Z",
        ledgerTransaction: accounting.ledgerTransaction
      }
    ];

    const summary = buildRuntimeDashboardSummary(records, listTenants(), "2026-07-14T00:00:00.000Z");
    const row = summary.rows.find((entry) => entry.slug === "shieldcheck");

    expect(summary.forgeRevenueAtomic).toBe("72000");
    expect(summary.founderPayableAtomic).toBe("320000");
    expect(summary.referralPayableAtomic).toBe("8000");
    expect(row).toMatchObject({
      forgeRevenueAtomic: "72000",
      founderPayableAtomic: "320000",
      referralPayableAtomic: "8000"
    });
  });

  it("fails closed when the journal is not balanced", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0x1111111111111111111111111111111111111111111111111111111111111111",
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z"
    });

    expect(() =>
      buildRuntimeDashboardSummary(
        [
          {
            type: "service_call",
            recordedAt: "2026-07-13T00:00:01.000Z",
            serviceCall: accounting.serviceCall
          },
          {
            type: "ledger_transaction",
            recordedAt: "2026-07-13T00:00:01.000Z",
            ledgerTransaction: {
              ...accounting.ledgerTransaction,
              entries: accounting.ledgerTransaction.entries.map((entry, index) =>
                index === 0 ? { ...entry, amountAtomic: "999999" } : entry
              )
            }
          }
        ],
        listTenants()
      )
    ).toThrow("Ledger journal integrity check failed");
  });
});
