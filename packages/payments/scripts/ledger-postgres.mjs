#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  checkLedgerJournal,
  createPostgresLedgerStore,
  ledgerJournalRecordKey,
  readLedgerJournal
} from "../dist/index.js";

const commands = new Set(["ready", "backfill", "reconcile", "export"]);
const args = parseArgs(process.argv.slice(2));
const command = args.positionals[0];

if (!commands.has(command)) {
  printUsage();
  process.exitCode = 1;
} else {
  try {
    await runCommand(command, args);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          command,
          error: error instanceof Error ? error.message : "Unknown ledger Postgres command error"
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }
}

async function runCommand(command, args) {
  const store = createStoreFromEnv();

  try {
    if (command === "ready") {
      await store.checkReady();
      printJson({ ok: true, command });
      return;
    }

    if (command === "export") {
      const outputPath = resolvePath(requiredOption(args, "output"));
      const postgresRecords = await store.read();
      const check = checkLedgerJournal(compactLedgerRecords(postgresRecords).records);

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, `${postgresRecords.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
      printJson({
        ok: check.ok,
        command,
        outputPath,
        postgresRecords: postgresRecords.length,
        uniquePostgresRecords: compactLedgerRecords(postgresRecords).records.length,
        check: summarizeCheck(check)
      });
      return;
    }

    const sourcePath = resolvePath(requiredOption(args, "path"));
    const sourceRecords = await readLedgerJournal(sourcePath);
    const compactedSource = compactLedgerRecords(sourceRecords, {
      mode: args.options.mode ?? "all"
    });
    const sourceCheck = checkLedgerJournal(compactedSource.records);

    if (!sourceCheck.ok) {
      throw new Error(`Compacted source ledger is not valid: ${sourceCheck.errors.join("; ")}`);
    }

    if (command === "backfill") {
      await store.append(compactedSource.records);
    } else {
      await store.checkReady();
    }

    const postgresRecords = await store.read();
    const reconciliation = reconcileLedgerRecords(compactedSource.records, postgresRecords);
    const ok = reconciliation.missingKeys.length === 0 && reconciliation.conflictingKeys.length === 0;

    printJson({
      ok,
      command,
      sourcePath,
      sourceRecords: sourceRecords.length,
      compactedSourceRecords: compactedSource.records.length,
      duplicateRecordsIgnored: compactedSource.duplicateRecordsIgnored,
      postgresRecords: postgresRecords.length,
      extraPostgresKeys: reconciliation.extraPostgresKeys.length,
      missingKeys: reconciliation.missingKeys,
      conflictingKeys: reconciliation.conflictingKeys,
      sourceCheck: summarizeCheck(sourceCheck)
    });

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await store.close();
  }
}

function createStoreFromEnv() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const sslMode = process.env.AGENTFORGE_DATABASE_SSL_MODE ?? process.env.PGSSLMODE;
  const options = {
    connectionString,
    maxConnections: positiveIntegerOrDefault(process.env.AGENTFORGE_DATABASE_MAX_CONNECTIONS, 5)
  };

  return createPostgresLedgerStore(
    sslMode
      ? {
          ...options,
          sslMode
        }
      : options
  );
}

function compactLedgerRecords(records, options = {}) {
  const mode = options.mode ?? "all";
  const selectedRecords =
    mode === "durable"
      ? records.filter((record) => record.type === "ledger_transaction" || record.serviceCall.status === "delivered")
      : records;
  const recordsByKey = new Map();
  let duplicateRecordsIgnored = 0;

  for (const record of selectedRecords) {
    const key = ledgerJournalRecordKey(record);
    const payloadHash = hashRecord(record);
    const existing = recordsByKey.get(key);

    if (!existing) {
      recordsByKey.set(key, {
        hash: payloadHash,
        record
      });
      continue;
    }

    if (existing.hash !== payloadHash) {
      throw new Error(`Conflicting duplicate ledger record key in source: ${key}`);
    }

    duplicateRecordsIgnored += 1;
  }

  return {
    records: [...recordsByKey.values()].map((entry) => entry.record),
    duplicateRecordsIgnored
  };
}

function reconcileLedgerRecords(sourceRecords, postgresRecords) {
  const sourceByKey = recordsByKey(sourceRecords);
  const postgresByKey = recordsByKey(postgresRecords);
  const missingKeys = [];
  const conflictingKeys = [];
  const extraPostgresKeys = [];

  for (const [key, sourceRecord] of sourceByKey) {
    const postgresRecord = postgresByKey.get(key);

    if (!postgresRecord) {
      missingKeys.push(key);
      continue;
    }

    if (!isDeepStrictEqual(sourceRecord, postgresRecord)) {
      conflictingKeys.push(key);
    }
  }

  for (const key of postgresByKey.keys()) {
    if (!sourceByKey.has(key)) {
      extraPostgresKeys.push(key);
    }
  }

  return {
    missingKeys,
    conflictingKeys,
    extraPostgresKeys
  };
}

function recordsByKey(records) {
  return new Map(records.map((record) => [ledgerJournalRecordKey(record), record]));
}

function hashRecord(record) {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

function summarizeCheck(check) {
  return {
    ok: check.ok,
    errors: check.errors,
    serviceCallCount: check.serviceCallCount,
    deliveredServiceCallCount: check.deliveredServiceCallCount,
    ledgerTransactionCount: check.ledgerTransactionCount,
    balances: check.balances
  };
}

function parseArgs(argv) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? argv[index + 1];

    if (inlineValue === undefined) {
      index += 1;
    }

    options[rawName] = value;
  }

  return {
    positionals,
    options
  };
}

function requiredOption(args, name) {
  const value = args.options[name];

  if (!value) {
    throw new Error(`Missing required --${name}`);
  }

  return value;
}

function resolvePath(path) {
  return isAbsolute(path) ? path : resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

function positiveIntegerOrDefault(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printUsage() {
  console.error(`Usage:
  npm run ledger:postgres --workspace @agentforge/payments -- ready
  npm run ledger:postgres --workspace @agentforge/payments -- backfill --path <ledger.jsonl> [--mode all|durable]
  npm run ledger:postgres --workspace @agentforge/payments -- reconcile --path <ledger.jsonl> [--mode all|durable]
  npm run ledger:postgres --workspace @agentforge/payments -- export --output <ledger-export.jsonl>`);
}
