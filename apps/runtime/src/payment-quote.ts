import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { hashRecoveryBody } from "./delivery-recovery.js";

export const paymentQuoteQueryParam = "af_quote";

export type PaymentQuoteRecord = {
  version: 1;
  quoteId: string;
  tenantSlug: string;
  createdAt: string;
  expiresAt: string;
  requestBodySha256: string;
  requestBody: unknown;
};

export class PaymentQuoteExpiredError extends Error {
  constructor(readonly quoteId: string) {
    super(`Payment quote expired: ${quoteId}`);
    this.name = "PaymentQuoteExpiredError";
  }
}

export class PaymentQuoteNotFoundError extends Error {
  constructor(readonly quoteId: string) {
    super(`Payment quote not found: ${quoteId}`);
    this.name = "PaymentQuoteNotFoundError";
  }
}

export function createPaymentQuoteRecord(input: {
  tenantSlug: string;
  requestBody: unknown;
  now?: Date;
  ttlMs: number;
}): PaymentQuoteRecord {
  const now = input.now ?? new Date();
  const requestBodySha256 = hashRecoveryBody(input.requestBody);
  const quoteId = `afq_${randomUUID().replaceAll("-", "").slice(0, 24)}_${requestBodySha256.slice(0, 10)}`;

  return {
    version: 1,
    quoteId,
    tenantSlug: input.tenantSlug,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(),
    requestBodySha256,
    requestBody: input.requestBody
  };
}

export async function persistPaymentQuote(rootDir: string, quote: PaymentQuoteRecord) {
  const path = paymentQuotePath(rootDir, quote.quoteId);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(quote, null, 2)}\n`, "utf8");
  return path;
}

export async function readPaymentQuote(rootDir: string, quoteId: string, now = new Date()) {
  const safeQuoteId = normalizePaymentQuoteId(quoteId);

  if (!safeQuoteId) {
    throw new PaymentQuoteNotFoundError(quoteId);
  }

  let parsed: PaymentQuoteRecord;

  try {
    parsed = JSON.parse(await readFile(paymentQuotePath(rootDir, safeQuoteId), "utf8")) as PaymentQuoteRecord;
  } catch {
    throw new PaymentQuoteNotFoundError(safeQuoteId);
  }

  if (parsed.version !== 1 || parsed.quoteId !== safeQuoteId) {
    throw new PaymentQuoteNotFoundError(safeQuoteId);
  }

  if (Date.parse(parsed.expiresAt) <= now.getTime()) {
    throw new PaymentQuoteExpiredError(safeQuoteId);
  }

  return parsed;
}

export function appendPaymentQuoteToEndpoint(endpoint: string, quoteId: string) {
  const url = new URL(endpoint, "http://agentforge.local");
  url.searchParams.set(paymentQuoteQueryParam, quoteId);

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

export function normalizePaymentQuoteId(value: string | null | undefined) {
  const quoteId = value?.trim();

  if (!quoteId || !/^afq_[a-f0-9]{24}_[a-f0-9]{10}$/.test(quoteId)) {
    return null;
  }

  return quoteId;
}

function paymentQuotePath(rootDir: string, quoteId: string) {
  const safeQuoteId = normalizePaymentQuoteId(quoteId);

  if (!safeQuoteId) {
    throw new PaymentQuoteNotFoundError(quoteId);
  }

  return join(rootDir, `${safeQuoteId}.json`);
}
