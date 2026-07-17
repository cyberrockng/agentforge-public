import { mkdir, readFile, appendFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Currency, LedgerTransaction, ServiceCall } from "./index.js";

export type LedgerJournalRecord =
  | {
      type: "service_call";
      recordedAt: string;
      serviceCall: ServiceCall;
    }
  | {
      type: "ledger_transaction";
      recordedAt: string;
      ledgerTransaction: LedgerTransaction;
    };

export type LedgerJournalCheck = {
  ok: boolean;
  errors: string[];
  serviceCallCount: number;
  deliveredServiceCallCount: number;
  ledgerTransactionCount: number;
  balances: Record<Currency, { debitAtomic: string; creditAtomic: string }>;
};

export type LedgerJournalAppendOptions = {
  lockTimeoutMs?: number;
  staleLockMs?: number;
  retryDelayMs?: number;
  lockOwner?: string;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

const journalAppendLocks = new Map<string, Promise<void>>();

export async function appendLedgerJournal(
  path: string,
  records: LedgerJournalRecord[],
  options: LedgerJournalAppendOptions = {}
) {
  await withJournalAppendLock(path, async () => {
    await mkdir(dirname(path), { recursive: true });
    await withJournalFileLock(path, options, async () => {
      const existingRecords = await readLedgerJournal(path);
      assertLedgerJournalIntegrity([...filterAppendIntegrityRecords(existingRecords), ...records]);
      await appendFile(path, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
    });
  });
}

export async function readLedgerJournal(path: string): Promise<LedgerJournalRecord[]> {
  const content = await readFile(path, "utf8").catch((error: unknown) => {
    if (isNotFound(error)) {
      return "";
    }

    throw error;
  });

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LedgerJournalRecord);
}

export function assertLedgerJournalIntegrity(records: LedgerJournalRecord[]) {
  const check = checkLedgerJournal(records);

  if (!check.ok) {
    throw new Error(`Ledger journal integrity check failed: ${check.errors.join("; ")}`);
  }
}

export function filterAppendIntegrityRecords(records: LedgerJournalRecord[]) {
  return records.filter(
    (record) => record.type === "ledger_transaction" || record.serviceCall.status === "delivered"
  );
}

export function ledgerJournalRecordKey(record: LedgerJournalRecord) {
  if (record.type === "service_call") {
    return `${record.type}:${record.serviceCall.id}`;
  }

  return `${record.type}:${record.ledgerTransaction.id}`;
}

export function checkLedgerJournal(records: LedgerJournalRecord[]): LedgerJournalCheck {
  const errors: string[] = [];
  const serviceCallIds = new Set<string>();
  const ledgerTransactionIds = new Set<string>();
  const deliveredServiceCallPaymentRefs = new Set<string>();
  const ledgerTransactionPaymentRefs = new Set<string>();
  const deliveredServiceCallsById = new Map<string, ServiceCall>();
  const balances = new Map<Currency, { debit: bigint; credit: bigint }>();
  let serviceCallCount = 0;
  let deliveredServiceCallCount = 0;
  let ledgerTransactionCount = 0;

  for (const record of records) {
    if (record.type === "service_call") {
      serviceCallCount += 1;
      const serviceCall = record.serviceCall;

      if (serviceCallIds.has(serviceCall.id)) {
        errors.push(`Duplicate service_call id: ${serviceCall.id}`);
      }
      serviceCallIds.add(serviceCall.id);

      if (serviceCall.status === "delivered") {
        deliveredServiceCallCount += 1;
        deliveredServiceCallsById.set(serviceCall.id, serviceCall);

        if (!serviceCall.paymentTransaction) {
          errors.push(`Delivered service_call ${serviceCall.id} is missing paymentTransaction`);
        } else if (deliveredServiceCallPaymentRefs.has(serviceCall.paymentTransaction.toLowerCase())) {
          errors.push(`Duplicate delivered service_call paymentTransaction: ${serviceCall.paymentTransaction}`);
        } else {
          deliveredServiceCallPaymentRefs.add(serviceCall.paymentTransaction.toLowerCase());
        }

        if (!serviceCall.ledgerTransactionId) {
          errors.push(`Delivered service_call ${serviceCall.id} is missing ledgerTransactionId`);
        }
      }
    } else if (record.type === "ledger_transaction") {
      ledgerTransactionCount += 1;
      const transaction = record.ledgerTransaction;

      if (ledgerTransactionIds.has(transaction.id)) {
        errors.push(`Duplicate ledger_transaction id: ${transaction.id}`);
      }
      ledgerTransactionIds.add(transaction.id);

      const paymentRef = transaction.metadata.paymentTransaction.toLowerCase();
      if (ledgerTransactionPaymentRefs.has(paymentRef)) {
        errors.push(`Duplicate ledger_transaction paymentTransaction: ${transaction.metadata.paymentTransaction}`);
      }
      ledgerTransactionPaymentRefs.add(paymentRef);

      const serviceCall = deliveredServiceCallsById.get(transaction.serviceCallId);
      if (serviceCall) {
        if (serviceCall.ledgerTransactionId !== transaction.id) {
          errors.push(
            `Ledger transaction ${transaction.id} does not match service_call ${serviceCall.id} ledgerTransactionId`
          );
        }

        if (serviceCall.paymentTransaction?.toLowerCase() !== paymentRef) {
          errors.push(`Ledger transaction ${transaction.id} paymentTransaction does not match service_call`);
        }
      }

      const transactionBalance = balanceLedgerTransaction(transaction);
      for (const [currency, total] of transactionBalance) {
        if (total.debit !== total.credit) {
          errors.push(
            `Unbalanced ledger_transaction ${transaction.id} for ${currency}: debit=${total.debit.toString()} credit=${total.credit.toString()}`
          );
        }

        const existing = balances.get(currency) ?? { debit: 0n, credit: 0n };
        existing.debit += total.debit;
        existing.credit += total.credit;
        balances.set(currency, existing);
      }
    } else {
      errors.push(`Unknown ledger journal record type: ${(record as { type?: string }).type ?? "missing"}`);
    }
  }

  for (const serviceCall of deliveredServiceCallsById.values()) {
    if (serviceCall.ledgerTransactionId && !ledgerTransactionIds.has(serviceCall.ledgerTransactionId)) {
      errors.push(`Delivered service_call ${serviceCall.id} references missing ledger_transaction`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    serviceCallCount,
    deliveredServiceCallCount,
    ledgerTransactionCount,
    balances: Object.fromEntries(
      [...balances.entries()].map(([currency, total]) => [
        currency,
        {
          debitAtomic: total.debit.toString(),
          creditAtomic: total.credit.toString()
        }
      ])
    ) as Record<Currency, { debitAtomic: string; creditAtomic: string }>
  };
}

function isNotFound(error: unknown): error is { code: "ENOENT" } {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}

function isAlreadyExists(error: unknown): error is { code: "EEXIST" } {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EEXIST");
}

function balanceLedgerTransaction(transaction: LedgerTransaction) {
  const totals = new Map<Currency, { debit: bigint; credit: bigint }>();

  for (const entry of transaction.entries) {
    const existing = totals.get(entry.currency) ?? { debit: 0n, credit: 0n };
    existing[entry.direction] += BigInt(entry.amountAtomic);
    totals.set(entry.currency, existing);
  }

  return totals;
}

async function withJournalAppendLock<T>(path: string, task: () => Promise<T>) {
  const previous = journalAppendLocks.get(path) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const lock = previous.then(() => current, () => current);

  journalAppendLocks.set(path, lock);
  await previous.catch(() => undefined);

  try {
    return await task();
  } finally {
    release();
    if (journalAppendLocks.get(path) === lock) {
      journalAppendLocks.delete(path);
    }
  }
}

async function withJournalFileLock<T>(
  path: string,
  options: LedgerJournalAppendOptions,
  task: () => Promise<T>
) {
  const release = await acquireJournalFileLock(path, options);

  try {
    return await task();
  } finally {
    await release();
  }
}

async function acquireJournalFileLock(path: string, options: LedgerJournalAppendOptions) {
  const lockDir = `${path}.lock`;
  const lockTimeoutMs = options.lockTimeoutMs ?? 10_000;
  const staleLockMs = options.staleLockMs ?? 120_000;
  const retryDelayMs = options.retryDelayMs ?? 25;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const startedAt = now();

  for (;;) {
    try {
      await mkdir(lockDir);
      await writeFile(
        join(lockDir, "owner.json"),
        `${JSON.stringify(
          {
            owner: options.lockOwner ?? `pid:${process.pid}`,
            createdAt: new Date(now()).toISOString()
          },
          null,
          2
        )}\n`,
        "utf8"
      );
      return async () => {
        await rm(lockDir, { recursive: true, force: true });
      };
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }

      const removedStaleLock = await removeStaleJournalLock(lockDir, now(), staleLockMs);
      if (removedStaleLock) {
        continue;
      }

      if (now() - startedAt >= lockTimeoutMs) {
        throw new Error(`Timed out waiting for ledger journal lock: ${lockDir}`);
      }

      await sleep(retryDelayMs);
    }
  }
}

async function removeStaleJournalLock(lockDir: string, currentTimeMs: number, staleLockMs: number) {
  try {
    const lockStats = await stat(lockDir);
    if (currentTimeMs - lockStats.mtimeMs <= staleLockMs) {
      return false;
    }

    await rm(lockDir, { recursive: true, force: true });
    return true;
  } catch (error) {
    if (isNotFound(error)) {
      return true;
    }

    throw error;
  }
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
