import { describe, expect, it } from "vitest";
import { buildPaidServiceCallAccounting, checkLedgerJournal, type LedgerJournalRecord } from "./index.js";
import {
  appendPostgresLedgerJournal,
  checkPostgresLedgerReady,
  postgresLedgerRecordFields,
  postgresLedgerSchemaStatements,
  readPostgresLedgerJournal,
  type PostgresLedgerPool,
  type PostgresLedgerQueryResult,
  type PostgresLedgerTransactionClient
} from "./postgres-journal.js";

const firstHeartbeatTx = "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b";
type ServiceCallJournalRecord = Extract<LedgerJournalRecord, { type: "service_call" }>;
type LedgerTransactionJournalRecord = Extract<LedgerJournalRecord, { type: "ledger_transaction" }>;

describe("postgres ledger journal", () => {
  it("declares durable ledger uniqueness constraints", () => {
    const schema = postgresLedgerSchemaStatements().join("\n");

    expect(schema).toContain("CREATE TABLE IF NOT EXISTS agentforge_ledger_journal");
    expect(schema).toContain("record_key TEXT NOT NULL UNIQUE");
    expect(schema).toContain("agentforge_ledger_service_payment_tx_unique");
    expect(schema).toContain("agentforge_ledger_transaction_payment_tx_unique");
  });

  it("checks readiness by ensuring the schema and querying the database", async () => {
    const pool = new FakePostgresLedgerPool();

    await checkPostgresLedgerReady(pool);

    expect(pool.statements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS"))).toBe(true);
    expect(pool.statements.some((statement) => statement.includes("SELECT 1 AS ok"))).toBe(true);
  });

  it("appends and reads paid service ledger rows", async () => {
    const pool = new FakePostgresLedgerPool();
    const records = paidRecords("forge", firstHeartbeatTx);

    await appendPostgresLedgerJournal(pool, records);

    const storedRecords = await readPostgresLedgerJournal(pool);
    expect(storedRecords).toEqual(records);
    expect(checkLedgerJournal(storedRecords).ok).toBe(true);
    expect(pool.statements.some((statement) => statement.includes("pg_advisory_xact_lock"))).toBe(true);
    expect(postgresLedgerRecordFields(records[0]).paymentTransaction).toBe(firstHeartbeatTx);
  });

  it("treats exact retry appends as idempotent no-ops", async () => {
    const pool = new FakePostgresLedgerPool();
    const records = paidRecords("forge", firstHeartbeatTx);

    await appendPostgresLedgerJournal(pool, records);
    await appendPostgresLedgerJournal(pool, records);

    await expect(readPostgresLedgerJournal(pool)).resolves.toHaveLength(2);
  });

  it("rejects conflicting rows that reuse an existing ledger record key", async () => {
    const pool = new FakePostgresLedgerPool();
    const records = paidRecords("forge", firstHeartbeatTx);
    const conflictingServiceCall = {
      ...records[0],
      serviceCall: {
        ...records[0].serviceCall,
        amountAtomic: "999999"
      }
    };

    await appendPostgresLedgerJournal(pool, records);

    await expect(appendPostgresLedgerJournal(pool, [conflictingServiceCall])).rejects.toThrow(
      "Conflicting ledger journal record key"
    );
    await expect(readPostgresLedgerJournal(pool)).resolves.toHaveLength(2);
  });

  it("rejects duplicate payment refs before committing a second tenant row", async () => {
    const pool = new FakePostgresLedgerPool();

    await appendPostgresLedgerJournal(pool, paidRecords("forge", firstHeartbeatTx));

    await expect(appendPostgresLedgerJournal(pool, paidRecords("shieldcheck", firstHeartbeatTx))).rejects.toThrow(
      "Duplicate delivered service_call paymentTransaction"
    );
    await expect(readPostgresLedgerJournal(pool)).resolves.toHaveLength(2);
  });
});

function paidRecords(
  tenantSlug: string,
  paymentTransaction: string
): [ServiceCallJournalRecord, LedgerTransactionJournalRecord] {
  const accounting = buildPaidServiceCallAccounting({
    tenantSlug,
    agentId: `agentforge-${tenantSlug}`,
    founderId: tenantSlug === "forge" ? "agentforge-core" : "founder-abiola-apata",
    serviceId: tenantSlug === "forge" ? "ai-agent-business-builder" : "phishing_scam_review",
    amountAtomic: "1000000",
    payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
    paymentTransaction,
    network: "eip155:196",
    occurredAt: "2026-07-17T00:00:00.000Z"
  });

  return [
    {
      type: "service_call",
      recordedAt: "2026-07-17T00:00:00.000Z",
      serviceCall: accounting.serviceCall
    },
    {
      type: "ledger_transaction",
      recordedAt: "2026-07-17T00:00:00.000Z",
      ledgerTransaction: accounting.ledgerTransaction
    }
  ];
}

type FakeRow = {
  sequence: number;
  recordKey: string;
  recordType: string;
  serviceCallId: string | null;
  ledgerTransactionId: string | null;
  paymentTransaction: string | null;
  recordJson: unknown;
};

class FakePostgresLedgerPool implements PostgresLedgerPool {
  rows: FakeRow[] = [];
  statements: string[] = [];
  private snapshot: FakeRow[] | null = null;

  async connect(): Promise<PostgresLedgerTransactionClient> {
    return {
      query: <Row extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: unknown[]) =>
        this.query<Row>(text, values),
      release: () => undefined
    };
  }

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values: unknown[] = []
  ): Promise<PostgresLedgerQueryResult<Row>> {
    this.statements.push(text);
    const normalized = text.replace(/\s+/g, " ").trim();

    if (normalized === "BEGIN") {
      this.snapshot = this.rows.map((row) => ({ ...row }));
      return { rows: [] };
    }

    if (normalized === "COMMIT") {
      this.snapshot = null;
      return { rows: [] };
    }

    if (normalized === "ROLLBACK") {
      if (this.snapshot) {
        this.rows = this.snapshot;
        this.snapshot = null;
      }
      return { rows: [] };
    }

    if (
      normalized.startsWith("CREATE ") ||
      normalized.startsWith("SELECT 1 AS ok") ||
      normalized.startsWith("SELECT pg_advisory_xact_lock")
    ) {
      return { rows: [] };
    }

    if (normalized.startsWith("SELECT record_json FROM agentforge_ledger_journal")) {
      return {
        rows: this.rows
          .sort((left, right) => left.sequence - right.sequence)
          .map((row) => ({ record_json: row.recordJson })) as unknown as Row[]
      };
    }

    if (normalized.startsWith("INSERT INTO agentforge_ledger_journal")) {
      const recordKey = String(values[0]);
      const recordType = String(values[1]);
      const serviceCallId = nullableString(values[4]);
      const ledgerTransactionId = nullableString(values[5]);
      const paymentTransaction = nullableString(values[6]);
      const recordJson = JSON.parse(String(values[7])) as unknown;

      if (this.rows.some((row) => row.recordKey === recordKey)) {
        return { rows: [] };
      }

      if (
        paymentTransaction &&
        this.rows.some(
          (row) => row.recordType === recordType && row.paymentTransaction?.toLowerCase() === paymentTransaction.toLowerCase()
        )
      ) {
        throw new Error("duplicate key value violates unique payment transaction constraint");
      }

      this.rows.push({
        sequence: this.rows.length + 1,
        recordKey,
        recordType,
        serviceCallId,
        ledgerTransactionId,
        paymentTransaction,
        recordJson
      });
      return { rows: [] };
    }

    throw new Error(`Unexpected fake query: ${text}`);
  }
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}
