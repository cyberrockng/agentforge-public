import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type DeliveryRecoveryHandle = {
  recoveryId: string;
  requestBodySha256: string;
  recoveryEndpoint: string;
  completeOrRefundPath: string;
  instructions: string[];
};

export type DeliveryArchiveRecord = {
  version: 1;
  archivedAt: string;
  tenantSlug: string;
  serviceCallId: string;
  paymentTransaction: string;
  requestBodySha256: string;
  responseBody: unknown;
};

export type DeliveryRecoveryRequest = {
  paymentTransaction?: string;
  serviceCallId?: string;
  requestBodySha256?: string;
  originalBody?: unknown;
  jobId?: string;
};

export function buildDeliveryRecoveryHandle(input: {
  serviceCallId: string;
  paymentTransaction: string;
  requestBody: unknown;
  recoveryEndpoint: string;
}): DeliveryRecoveryHandle {
  return {
    recoveryId: input.serviceCallId,
    requestBodySha256: hashRecoveryBody(input.requestBody),
    recoveryEndpoint: input.recoveryEndpoint,
    completeOrRefundPath:
      "Inspect the recovered deliverable before completing or reviewing the task. If recovery cannot return it, request make-good delivery with the exact body or agree-refund.",
    instructions: [
      "If the paid response is lost, POST paymentTransaction plus the original JSON body to recoveryEndpoint.",
      "The recovery endpoint returns an archived buyer response only when the original body hash matches the paid call.",
      "If the endpoint reports payment_not_found_in_agentforge_ledger, the replay probably never reached AgentForge; send the job id, payment transaction, and exact JSON body for manual make-good or refund."
    ]
  };
}

export function buildRecoveryInfo(input: {
  tenantSlug: string;
  serviceTitle: string;
  recoveryEndpoint: string;
}) {
  return {
    ok: true,
    tenant: input.tenantSlug,
    service: input.serviceTitle,
    recoveryEndpoint: input.recoveryEndpoint,
    accepts: {
      paymentTransaction: "0x-prefixed X Layer payment transaction hash",
      serviceCallId: "optional AgentForge serviceCallId if the original response exposed it",
      originalBody: "the exact JSON body used for the paid x402 replay",
      requestBodySha256: "optional sha256 from the original response; originalBody is preferred"
    },
    privacy:
      "Recovery does not list archived deliverables. It requires the paid reference plus the original body or body hash before returning a buyer response.",
    fallback:
      "If the paid replay never reached AgentForge, no archive can exist. Send the job id, payment transaction, and exact JSON body to request make-good delivery or agree-refund."
  };
}

export function buildDeliveryArchiveRecord(input: {
  archivedAt: string;
  tenantSlug: string;
  serviceCallId: string;
  paymentTransaction: string;
  requestBody: unknown;
  responseBody: unknown;
}): DeliveryArchiveRecord {
  return {
    version: 1,
    archivedAt: input.archivedAt,
    tenantSlug: input.tenantSlug,
    serviceCallId: input.serviceCallId,
    paymentTransaction: input.paymentTransaction,
    requestBodySha256: hashRecoveryBody(input.requestBody),
    responseBody: input.responseBody
  };
}

export async function persistDeliveryArchive(rootDir: string, record: DeliveryArchiveRecord) {
  const path = deliveryArchivePath(rootDir, record.serviceCallId);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return path;
}

export async function readDeliveryArchive(rootDir: string, serviceCallId: string) {
  const path = deliveryArchivePath(rootDir, serviceCallId);
  const content = await readFile(path, "utf8");
  return JSON.parse(content) as DeliveryArchiveRecord;
}

export function recoveryBodyHash(request: DeliveryRecoveryRequest) {
  if (request.originalBody !== undefined) {
    return hashRecoveryBody(request.originalBody);
  }

  return request.requestBodySha256?.trim().toLowerCase() ?? null;
}

export function hashRecoveryBody(body: unknown) {
  return createHash("sha256").update(stableStringify(body)).digest("hex");
}

function deliveryArchivePath(rootDir: string, serviceCallId: string) {
  const safeId = serviceCallId.replace(/[^a-zA-Z0-9_-]+/g, "_");
  return join(rootDir, `${safeId}.json`);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}
