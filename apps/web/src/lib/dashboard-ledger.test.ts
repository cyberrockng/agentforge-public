import { describe, expect, it } from "vitest";
import { formatUsdt, getDashboardSummary } from "./dashboard-ledger";

describe("dashboard ledger summary", () => {
  it("renders committed paid-call journal fallback revenue", async () => {
    const summary = await getDashboardSummary({ allowRuntime: false });

    expect(summary).toMatchObject({
      paidCalls: 3,
      settledAtomic: "1850000",
      forgeRevenueAtomic: "1530000",
      founderPayableAtomic: "320000",
      referralPayableAtomic: "0"
    });
    expect(summary.latestCall).toMatchObject({
      id: "sc_launch-kit_3b103d9976a5",
      tenantSlug: "launch-kit",
      paymentTransaction: "0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a"
    });
  });

  it("uses the runtime ledger summary when available", async () => {
    const summary = await getDashboardSummary({
      fetcher: async () =>
        new Response(
          JSON.stringify({
            generatedAt: "2026-07-14T00:00:00.000Z",
            source: "Runtime JSONL ledger journal",
            paidCalls: 2,
            settledAtomic: "3000000",
            forgeRevenueAtomic: "1400000",
            founderPayableAtomic: "1600000",
            referralPayableAtomic: "100000",
            rows: [],
            latestCall: null
          }),
          { status: 200 }
        )
    });

    expect(summary).toMatchObject({
      source: "Runtime JSONL ledger journal",
      paidCalls: 2,
      founderPayableAtomic: "1600000",
      referralPayableAtomic: "100000"
    });
  });

  it("normalizes pre-T5.2 runtime summaries without referral fields during rollout", async () => {
    const summary = await getDashboardSummary({
      fetcher: async () =>
        new Response(
          JSON.stringify({
            generatedAt: "2026-07-14T00:00:00.000Z",
            source: "Runtime JSONL ledger journal",
            paidCalls: 1,
            settledAtomic: "1000000",
            forgeRevenueAtomic: "1000000",
            founderPayableAtomic: "0",
            rows: [
              {
                slug: "forge",
                label: "AgentForge",
                founderLabel: "AgentForge core",
                status: "Public paid service",
                paidCalls: 1,
                settledAtomic: "1000000",
                forgeRevenueAtomic: "1000000",
                founderPayableAtomic: "0"
              }
            ],
            latestCall: null
          }),
          { status: 200 }
        )
    });

    expect(summary.referralPayableAtomic).toBe("0");
    expect(summary.rows[0]?.referralPayableAtomic).toBe("0");
  });

  it("includes ShieldCheck and Launch Kit proof calls in the committed fallback", async () => {
    const summary = await getDashboardSummary({ allowRuntime: false });
    const shieldCheck = summary.rows.find((row) => row.slug === "shieldcheck");
    const launchKit = summary.rows.find((row) => row.slug === "launch-kit");

    expect(shieldCheck).toMatchObject({
      paidCalls: 1,
      settledAtomic: "400000",
      forgeRevenueAtomic: "80000",
      founderPayableAtomic: "320000",
      referralPayableAtomic: "0",
      status: "Paid heartbeat complete; controlled soft-launch"
    });
    expect(launchKit).toMatchObject({
      paidCalls: 1,
      settledAtomic: "450000",
      forgeRevenueAtomic: "450000",
      founderPayableAtomic: "0",
      referralPayableAtomic: "0",
      status: "Paid heartbeat complete; soft-launch transition pending"
    });
  });

  it("formats atomic USDT without rounding", () => {
    expect(formatUsdt("1000000")).toBe("1.000000 USDT");
    expect(formatUsdt("1")).toBe("0.000001 USDT");
  });
});
