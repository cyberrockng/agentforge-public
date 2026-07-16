import { appendFile, mkdir, mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AGENTFORGE_OWNED_SPLIT,
  DEFAULT_FOUNDER_SPLIT,
  assertBalancedLedgerTransaction,
  buildPaidServiceCallAccounting,
  buildQuotedServiceCall,
  checkLedgerJournal,
  serviceCallIdForQuote,
  splitAmountAtomic,
  splitPolicyForFounder
} from "./index.js";
import { appendLedgerJournal, readLedgerJournal } from "./journal.js";

const firstHeartbeatTx = "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b";

describe("splitAmountAtomic", () => {
  it("splits founder tenants 80/20 without losing atomic units", () => {
    expect(splitAmountAtomic("1000000", DEFAULT_FOUNDER_SPLIT)).toEqual({
      founderAmountAtomic: "800000",
      forgeAmountAtomic: "200000",
      forgeGrossAmountAtomic: "200000",
      referralAmountAtomic: "0"
    });
  });

  it("keeps AgentForge-owned calls fully in Forge revenue", () => {
    expect(splitAmountAtomic("1000000", AGENTFORGE_OWNED_SPLIT)).toEqual({
      founderAmountAtomic: "0",
      forgeAmountAtomic: "1000000",
      forgeGrossAmountAtomic: "1000000",
      referralAmountAtomic: "0"
    });
    expect(splitPolicyForFounder("agentforge-core")).toEqual(AGENTFORGE_OWNED_SPLIT);
  });

  it("rejects split policies that do not sum to 10000 bps", () => {
    expect(() => splitAmountAtomic("1000000", { founderBps: 9000, forgeBps: 500 })).toThrow(
      "Split basis points must be non-negative and sum to 10000."
    );
  });
});

describe("buildPaidServiceCallAccounting", () => {
  it("backfills the real First Heartbeat as a balanced AgentForge-owned transaction", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: firstHeartbeatTx,
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z",
      evidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md"
    });

    expect(accounting.serviceCall).toMatchObject({
      id: "sc_forge_b8f8787c7c13",
      tenantSlug: "forge",
      status: "delivered",
      amountAtomic: "1000000",
      ledgerTransactionId: "lt_forge_b8f8787c7c13"
    });
    expect(accounting.split).toEqual({
      founderAmountAtomic: "0",
      forgeAmountAtomic: "1000000",
      forgeGrossAmountAtomic: "1000000",
      referralAmountAtomic: "0"
    });
    expect(accounting.ledgerTransaction.entries).toEqual([
      expect.objectContaining({
        account: "asset:wallet:eip155:196:settlement",
        direction: "debit",
        amountAtomic: "1000000"
      }),
      expect.objectContaining({
        account: "revenue:forge:forge",
        direction: "credit",
        amountAtomic: "1000000"
      })
    ]);
    expect(() => assertBalancedLedgerTransaction(accounting.ledgerTransaction)).not.toThrow();
  });

  it("creates founder payable liability for spawned founder tenants", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "2000000",
      payer: "0x1111111111111111111111111111111111111111",
      paymentTransaction: "0x1111111111111111111111111111111111111111111111111111111111111111",
      network: "eip155:196",
      occurredAt: "2026-07-13T00:00:00.000Z"
    });

    expect(accounting.split).toEqual({
      founderAmountAtomic: "1600000",
      forgeAmountAtomic: "400000",
      forgeGrossAmountAtomic: "400000",
      referralAmountAtomic: "0"
    });
    expect(accounting.ledgerTransaction.entries).toContainEqual(
      expect.objectContaining({
        account: "liability:founder:founder-abiola-apata",
        direction: "credit",
        amountAtomic: "1600000"
      })
    );
    expect(() => assertBalancedLedgerTransaction(accounting.ledgerTransaction)).not.toThrow();
  });

  it("deducts referral credits from Forge share with balanced liability entries", () => {
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "400000",
      payer: "0x1111111111111111111111111111111111111111",
      paymentTransaction: "0x3333333333333333333333333333333333333333333333333333333333333333",
      network: "eip155:196",
      occurredAt: "2026-07-14T00:00:00.000Z",
      referralAttribution: {
        code: "shieldcheck-founder",
        beneficiaryId: "founder-abiola-apata"
      }
    });

    expect(accounting.split).toEqual({
      founderAmountAtomic: "320000",
      forgeGrossAmountAtomic: "80000",
      referralAmountAtomic: "8000",
      forgeAmountAtomic: "72000"
    });
    expect(accounting.referral).toEqual({
      code: "shieldcheck-founder",
      beneficiaryId: "founder-abiola-apata",
      bps: 1000,
      basis: "forge_share",
      amountAtomic: "8000"
    });
    expect(accounting.serviceCall.referral).toEqual({
      code: "shieldcheck-founder",
      beneficiaryId: "founder-abiola-apata"
    });
    expect(accounting.ledgerTransaction.entries).toContainEqual(
      expect.objectContaining({
        account: "revenue:forge:shieldcheck:referral-credit",
        direction: "debit",
        amountAtomic: "8000"
      })
    );
    expect(accounting.ledgerTransaction.entries).toContainEqual(
      expect.objectContaining({
        account: "liability:referral:founder-abiola-apata",
        direction: "credit",
        amountAtomic: "8000"
      })
    );
    expect(() => assertBalancedLedgerTransaction(accounting.ledgerTransaction)).not.toThrow();
  });

  it("rejects malformed referral attribution", () => {
    expect(() =>
      buildPaidServiceCallAccounting({
        tenantSlug: "forge",
        agentId: "agentforge-3746",
        founderId: "agentforge-core",
        serviceId: "ai-agent-business-builder",
        amountAtomic: "1000000",
        payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
        paymentTransaction: firstHeartbeatTx,
        network: "eip155:196",
        occurredAt: "2026-07-04T00:00:00.000Z",
        referralAttribution: {
          code: "BAD CODE",
          beneficiaryId: "founder-abiola-apata"
        }
      })
    ).toThrow("Invalid referral code");
  });

  it("rejects malformed payment transaction refs", () => {
    expect(() =>
      buildPaidServiceCallAccounting({
        tenantSlug: "forge",
        agentId: "agentforge-3746",
        founderId: "agentforge-core",
        serviceId: "ai-agent-business-builder",
        amountAtomic: "1000000",
        payer: "payer",
        paymentTransaction: "not-a-tx",
        network: "eip155:196",
        occurredAt: "2026-07-04T00:00:00.000Z"
      })
    ).toThrow("Invalid payment transaction hash");
  });

  it("creates collision-safe quote ids for same-millisecond quote bursts", () => {
    const quotedAt = "2026-07-14T14:15:16.123Z";
    const ids = new Set(
      Array.from({ length: 1000 }, (_, index) => serviceCallIdForQuote("forge", quotedAt, `burst-${index}`))
    );

    expect(ids.size).toBe(1000);
  });

  it("gives consecutive quoted service calls unique ids even with the same timestamp", () => {
    const quotedAt = "2026-07-14T14:15:16.123Z";
    const first = buildQuotedServiceCall({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      network: "eip155:196",
      quotedAt
    });
    const second = buildQuotedServiceCall({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      network: "eip155:196",
      quotedAt
    });

    expect(first.id).not.toBe(second.id);
  });
});

describe("ledger journal", () => {
  it("persists service call and ledger transaction rows as JSONL", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");
    const quoted = buildQuotedServiceCall({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      network: "eip155:196",
      quotedAt: "2026-07-13T00:00:00.000Z"
    });
    const paid = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: firstHeartbeatTx,
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z"
    });

    await appendLedgerJournal(path, [
      {
        type: "service_call",
        recordedAt: "2026-07-13T00:00:00.000Z",
        serviceCall: quoted
      },
      {
        type: "service_call",
        recordedAt: "2026-07-13T00:00:01.000Z",
        serviceCall: paid.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-13T00:00:01.000Z",
        ledgerTransaction: paid.ledgerTransaction
      }
    ]);

    await expect(readLedgerJournal(path)).resolves.toHaveLength(3);
    await rm(dir, { recursive: true, force: true });
  });

  it("allows appending delivered rows when legacy duplicate quote rows already exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");
    const quoted = buildQuotedServiceCall({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      network: "eip155:196",
      quotedAt: "2026-07-14T13:38:14.965Z",
      quoteNonce: "legacy-duplicate"
    });
    const paid = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "400000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: "0x32ff45e2b65719f43815a5b7bc15aa74f8f6f047cdacaf76863e5195dc9d9054",
      network: "eip155:196",
      occurredAt: "2026-07-14T16:54:11.000Z"
    });
    const duplicateQuoteRow = {
      type: "service_call",
      recordedAt: "2026-07-14T13:38:14.965Z",
      serviceCall: quoted
    } as const;

    await appendFile(path, `${JSON.stringify(duplicateQuoteRow)}\n${JSON.stringify(duplicateQuoteRow)}\n`, "utf8");
    await appendLedgerJournal(path, [
      {
        type: "service_call",
        recordedAt: "2026-07-14T16:54:11.000Z",
        serviceCall: paid.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-14T16:54:11.000Z",
        ledgerTransaction: paid.ledgerTransaction
      }
    ]);

    await expect(readLedgerJournal(path)).resolves.toHaveLength(4);
    await expect(appendLedgerJournal(path, [
      {
        type: "service_call",
        recordedAt: "2026-07-14T16:54:12.000Z",
        serviceCall: paid.serviceCall
      }
    ])).rejects.toThrow("Duplicate service_call id");
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects duplicate delivered payment refs instead of double-counting a settlement", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");
    const paid = buildPaidServiceCallAccounting({
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      amountAtomic: "1000000",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      paymentTransaction: firstHeartbeatTx,
      network: "eip155:196",
      occurredAt: "2026-07-04T00:00:00.000Z"
    });
    const records = [
      {
        type: "service_call",
        recordedAt: "2026-07-13T00:00:01.000Z",
        serviceCall: paid.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-13T00:00:01.000Z",
        ledgerTransaction: paid.ledgerTransaction
      }
    ] as const;

    await appendLedgerJournal(path, [...records]);
    await expect(appendLedgerJournal(path, [...records])).rejects.toThrow(
      "Duplicate delivered service_call paymentTransaction"
    );
    await expect(readLedgerJournal(path)).resolves.toHaveLength(2);
    await rm(dir, { recursive: true, force: true });
  });

  it("detects tampered unbalanced ledger transactions", () => {
    const paid = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "2000000",
      payer: "0x1111111111111111111111111111111111111111",
      paymentTransaction: "0x2222222222222222222222222222222222222222222222222222222222222222",
      network: "eip155:196",
      occurredAt: "2026-07-13T00:00:00.000Z"
    });
    const check = checkLedgerJournal([
      {
        type: "service_call",
        recordedAt: "2026-07-13T00:00:01.000Z",
        serviceCall: paid.serviceCall
      },
      {
        type: "ledger_transaction",
        recordedAt: "2026-07-13T00:00:01.000Z",
        ledgerTransaction: {
          ...paid.ledgerTransaction,
          entries: paid.ledgerTransaction.entries.map((entry, index) =>
            index === 0 ? { ...entry, amountAtomic: "1999999" } : entry
          )
        }
      }
    ]);

    expect(check.ok).toBe(false);
    expect(check.errors.join(" ")).toContain("Unbalanced ledger_transaction");
  });

  it("keeps 500 generated paid calls balanced and unique by payment ref", () => {
    const records = Array.from({ length: 500 }, (_, index) => {
      const tx = deterministicTx(index + 1);
      const accounting = buildPaidServiceCallAccounting({
        tenantSlug: "shieldcheck",
        agentId: "agentforge-shieldcheck-01",
        founderId: "founder-abiola-apata",
        serviceId: "phishing_scam_review",
        amountAtomic: (2_000_000 + index).toString(),
        payer: "0x1111111111111111111111111111111111111111",
        paymentTransaction: tx,
        network: "eip155:196",
        occurredAt: `2026-07-14T00:${String(index % 60).padStart(2, "0")}:00.000Z`
      });

      return [
        {
          type: "service_call" as const,
          recordedAt: "2026-07-14T00:00:00.000Z",
          serviceCall: accounting.serviceCall
        },
        {
          type: "ledger_transaction" as const,
          recordedAt: "2026-07-14T00:00:00.000Z",
          ledgerTransaction: accounting.ledgerTransaction
        }
      ];
    }).flat();

    const check = checkLedgerJournal(records);

    expect(check.ok).toBe(true);
    expect(check.deliveredServiceCallCount).toBe(500);
    expect(check.ledgerTransactionCount).toBe(500);
    expect(check.balances.USDT?.debitAtomic).toBe(check.balances.USDT?.creditAtomic);
  });

  it("serializes concurrent journal appends against the current ledger tail", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");

    try {
      await Promise.all(
        Array.from({ length: 25 }, async (_, index) => {
          const tx = deterministicTx(index + 1000);
          const accounting = buildPaidServiceCallAccounting({
            tenantSlug: "shieldcheck",
            agentId: "agentforge-shieldcheck-01",
            founderId: "founder-abiola-apata",
            serviceId: "phishing_scam_review",
            amountAtomic: (400_000 + index).toString(),
            payer: "0x1111111111111111111111111111111111111111",
            paymentTransaction: tx,
            network: "eip155:196",
            occurredAt: `2026-07-14T01:00:${String(index).padStart(2, "0")}.000Z`
          });

          await appendLedgerJournal(path, [
            {
              type: "service_call",
              recordedAt: "2026-07-14T01:00:00.000Z",
              serviceCall: accounting.serviceCall
            },
            {
              type: "ledger_transaction",
              recordedAt: "2026-07-14T01:00:00.000Z",
              ledgerTransaction: accounting.ledgerTransaction
            }
          ]);
        })
      );

      const records = await readLedgerJournal(path);
      const check = checkLedgerJournal(records);

      expect(records).toHaveLength(50);
      expect(check.ok).toBe(true);
      expect(check.deliveredServiceCallCount).toBe(25);
      expect(check.ledgerTransactionCount).toBe(25);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails closed instead of appending while another process holds the journal lock", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");
    const lockDir = `${path}.lock`;
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "400000",
      payer: "0x1111111111111111111111111111111111111111",
      paymentTransaction: deterministicTx(2000),
      network: "eip155:196",
      occurredAt: "2026-07-14T02:00:00.000Z"
    });

    try {
      await mkdir(lockDir, { recursive: true });
      await expect(
        appendLedgerJournal(
          path,
          [
            {
              type: "service_call",
              recordedAt: "2026-07-14T02:00:00.000Z",
              serviceCall: accounting.serviceCall
            },
            {
              type: "ledger_transaction",
              recordedAt: "2026-07-14T02:00:00.000Z",
              ledgerTransaction: accounting.ledgerTransaction
            }
          ],
          { lockTimeoutMs: 0, staleLockMs: 60_000 }
        )
      ).rejects.toThrow("Timed out waiting for ledger journal lock");

      await expect(readLedgerJournal(path)).resolves.toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("recovers a stale journal lock left by an interrupted process", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-ledger-"));
    const path = join(dir, "ledger.jsonl");
    const lockDir = `${path}.lock`;
    const now = new Date("2026-07-16T12:00:00.000Z").getTime();
    const staleTime = new Date(now - 60_000);
    const accounting = buildPaidServiceCallAccounting({
      tenantSlug: "shieldcheck",
      agentId: "agentforge-shieldcheck-01",
      founderId: "founder-abiola-apata",
      serviceId: "phishing_scam_review",
      amountAtomic: "400001",
      payer: "0x1111111111111111111111111111111111111111",
      paymentTransaction: deterministicTx(2001),
      network: "eip155:196",
      occurredAt: "2026-07-14T02:00:01.000Z"
    });

    try {
      await mkdir(lockDir, { recursive: true });
      await utimes(lockDir, staleTime, staleTime);
      await appendLedgerJournal(
        path,
        [
          {
            type: "service_call",
            recordedAt: "2026-07-14T02:00:01.000Z",
            serviceCall: accounting.serviceCall
          },
          {
            type: "ledger_transaction",
            recordedAt: "2026-07-14T02:00:01.000Z",
            ledgerTransaction: accounting.ledgerTransaction
          }
        ],
        {
          now: () => now,
          staleLockMs: 1_000,
          lockTimeoutMs: 100
        }
      );

      const records = await readLedgerJournal(path);
      expect(records).toHaveLength(2);
      expect(checkLedgerJournal(records).ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

function deterministicTx(index: number): `0x${string}` {
  const uniquePrefix = index.toString(16).padStart(12, "0");
  return `0x${uniquePrefix}${"0".repeat(52)}`;
}
