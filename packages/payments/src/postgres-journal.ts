import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import type { PoolConfig } from "pg";
import {
  assertLedgerJournalIntegrity,
  filterAppendIntegrityRecords,
  ledgerJournalRecordKey,
  type LedgerJournalRecord
} from "./journal.js";

const { Pool } = pg;
const ledgerTableName = "agentforge_ledger_journal";

export type PostgresLedgerQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> = {
  rows: Row[];
};

export type PostgresLedgerQueryable = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<PostgresLedgerQueryResult<Row>>;
};

export type PostgresLedgerTransactionClient = PostgresLedgerQueryable & {
  release: () => void;
};

export type PostgresLedgerPool = PostgresLedgerQueryable & {
  connect: () => Promise<PostgresLedgerTransactionClient>;
};

export type PostgresLedgerSslMode =
  | "disable"
  | "allow"
  | "prefer"
  | "require"
  | "verify-ca"
  | "verify-full"
  | "no-verify";

export type CreatePostgresLedgerStoreOptions = {
  connectionString: string;
  maxConnections?: number;
  sslMode?: PostgresLedgerSslMode;
};

export type PostgresLedgerStore = {
  append: (records: LedgerJournalRecord[]) => Promise<void>;
  read: () => Promise<LedgerJournalRecord[]>;
  checkReady: () => Promise<void>;
  close: () => Promise<void>;
};

type PostgresLedgerRecordFields = {
  recordKey: string;
  recordType: LedgerJournalRecord["type"];
  recordedAt: string;
  tenantSlug: string | null;
  serviceCallId: string | null;
  ledgerTransactionId: string | null;
  paymentTransaction: string | null;
  recordJson: string;
};

type PostgresLedgerRow = {
  record_json: unknown;
};

type PgPoolWithEnd = PostgresLedgerPool & {
  end: () => Promise<void>;
};

export function createPostgresLedgerStore(options: CreatePostgresLedgerStoreOptions): PostgresLedgerStore {
  const poolOptions: PoolConfig = {
    connectionString: options.connectionString,
    max: options.maxConnections ?? 5
  };
  const ssl = postgresSslConfig(options.sslMode);

  if (ssl !== undefined) {
    poolOptions.ssl = ssl;
  }

  const pool = new Pool(poolOptions) as PgPoolWithEnd;

  return {
    append: (records) => appendPostgresLedgerJournal(pool, records),
    read: () => readPostgresLedgerJournal(pool),
    checkReady: () => checkPostgresLedgerReady(pool),
    close: () => pool.end()
  };
}

export async function checkPostgresLedgerReady(client: PostgresLedgerQueryable) {
  await ensurePostgresLedgerSchema(client);
  await client.query("SELECT 1 AS ok");
}

export async function appendPostgresLedgerJournal(pool: PostgresLedgerPool, records: LedgerJournalRecord[]) {
  if (records.length === 0) {
    return;
  }

  await ensurePostgresLedgerSchema(pool);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(21954, 46309)");

    const existingRecords = await readPostgresLedgerJournalRecords(client);
    const recordsToInsert = filterAlreadyStoredRecords(records, existingRecords);

    assertLedgerJournalIntegrity([
      ...filterAppendIntegrityRecords(existingRecords),
      ...recordsToInsert
    ]);

    for (const record of recordsToInsert) {
      const fields = postgresLedgerRecordFields(record);
      await client.query(
        `INSERT INTO ${ledgerTableName} (
          record_key,
          record_type,
          recorded_at,
          tenant_slug,
          service_call_id,
          ledger_transaction_id,
          payment_transaction,
          record_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (record_key) DO NOTHING`,
        [
          fields.recordKey,
          fields.recordType,
          fields.recordedAt,
          fields.tenantSlug,
          fields.serviceCallId,
          fields.ledgerTransactionId,
          fields.paymentTransaction,
          fields.recordJson
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function readPostgresLedgerJournal(client: PostgresLedgerQueryable): Promise<LedgerJournalRecord[]> {
  await ensurePostgresLedgerSchema(client);
  return readPostgresLedgerJournalRecords(client);
}

export async function ensurePostgresLedgerSchema(client: PostgresLedgerQueryable) {
  for (const statement of postgresLedgerSchemaStatements()) {
    await client.query(statement);
  }
}

export function postgresLedgerSchemaStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS ${ledgerTableName} (
      sequence BIGSERIAL PRIMARY KEY,
      record_key TEXT NOT NULL UNIQUE,
      record_type TEXT NOT NULL CHECK (record_type IN ('service_call', 'ledger_transaction')),
      recorded_at TIMESTAMPTZ NOT NULL,
      tenant_slug TEXT,
      service_call_id TEXT,
      ledger_transaction_id TEXT,
      payment_transaction TEXT,
      record_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS agentforge_ledger_recorded_at_idx
      ON ${ledgerTableName} (recorded_at)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS agentforge_ledger_service_call_id_unique
      ON ${ledgerTableName} (service_call_id)
      WHERE record_type = 'service_call' AND service_call_id IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS agentforge_ledger_transaction_id_unique
      ON ${ledgerTableName} (ledger_transaction_id)
      WHERE record_type = 'ledger_transaction' AND ledger_transaction_id IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS agentforge_ledger_service_payment_tx_unique
      ON ${ledgerTableName} (lower(payment_transaction))
      WHERE record_type = 'service_call' AND payment_transaction IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS agentforge_ledger_transaction_payment_tx_unique
      ON ${ledgerTableName} (lower(payment_transaction))
      WHERE record_type = 'ledger_transaction' AND payment_transaction IS NOT NULL`
  ];
}

export function postgresLedgerRecordFields(record: LedgerJournalRecord): PostgresLedgerRecordFields {
  if (record.type === "service_call") {
    return {
      recordKey: ledgerJournalRecordKey(record),
      recordType: record.type,
      recordedAt: record.recordedAt,
      tenantSlug: record.serviceCall.tenantSlug,
      serviceCallId: record.serviceCall.id,
      ledgerTransactionId: record.serviceCall.ledgerTransactionId,
      paymentTransaction: record.serviceCall.paymentTransaction,
      recordJson: JSON.stringify(record)
    };
  }

  return {
    recordKey: ledgerJournalRecordKey(record),
    recordType: record.type,
    recordedAt: record.recordedAt,
    tenantSlug: record.ledgerTransaction.metadata.tenantSlug,
    serviceCallId: record.ledgerTransaction.serviceCallId,
    ledgerTransactionId: record.ledgerTransaction.id,
    paymentTransaction: record.ledgerTransaction.metadata.paymentTransaction,
    recordJson: JSON.stringify(record)
  };
}

async function readPostgresLedgerJournalRecords(client: PostgresLedgerQueryable): Promise<LedgerJournalRecord[]> {
  const result = await client.query<PostgresLedgerRow>(
    `SELECT record_json
      FROM ${ledgerTableName}
      ORDER BY sequence ASC`
  );

  return result.rows.map((row) => parseLedgerJournalRecord(row.record_json));
}

function filterAlreadyStoredRecords(records: LedgerJournalRecord[], existingRecords: LedgerJournalRecord[]) {
  const existingByKey = new Map(existingRecords.map((record) => [ledgerJournalRecordKey(record), record]));

  return records.filter((record) => {
    const key = ledgerJournalRecordKey(record);
    const existingRecord = existingByKey.get(key);

    if (!existingRecord) {
      return true;
    }

    if (isDeepStrictEqual(existingRecord, record)) {
      return false;
    }

    throw new Error(`Conflicting ledger journal record key: ${key}`);
  });
}

function parseLedgerJournalRecord(value: unknown): LedgerJournalRecord {
  const record = typeof value === "string" ? JSON.parse(value) : value;

  if (!record || typeof record !== "object" || !("type" in record)) {
    throw new Error("Postgres ledger row contains an invalid journal record");
  }

  const recordType = (record as { type?: unknown }).type;

  if (recordType !== "service_call" && recordType !== "ledger_transaction") {
    throw new Error("Postgres ledger row contains an unknown journal record type");
  }

  return record as LedgerJournalRecord;
}

function postgresSslConfig(mode: PostgresLedgerSslMode | undefined) {
  if (!mode || mode === "allow" || mode === "prefer") {
    return undefined;
  }

  if (mode === "disable") {
    return false;
  }

  if (mode === "require" || mode === "no-verify") {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
}
