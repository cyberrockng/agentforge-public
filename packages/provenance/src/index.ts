import { createHash } from "node:crypto";

export const agentforgeProvenancePackage = "provenance";
export const FORGE_ANCHOR_SCHEMA = "agentforge.anchor.v1";
export const SERVICE_RECEIPT_SCHEMA = "agentforge.service-receipt.v1";
export const SERVICE_RECEIPT_ANCHOR_SCHEMA = "agentforge.service-receipt-anchor.v1";

export type Hex32 = `0x${string}`;
export type TransactionHash = `0x${string}`;

export type ForgeAnchorSubject = {
  agentId: string;
  founderId: string;
  agentSpecHash: Hex32;
};

export type ForgeAnchorEvidence = {
  heartbeatTx: TransactionHash;
  network: string;
  serviceCallId?: string;
  ledgerTransactionId?: string;
  evidenceRef?: string;
};

export type ForgeAnchorCommitmentInput = {
  subject: ForgeAnchorSubject;
  evidence: ForgeAnchorEvidence;
  issuedAt: string;
  issuer: string;
};

export type ForgeAnchorMetadata = {
  schema: typeof FORGE_ANCHOR_SCHEMA;
  subject: ForgeAnchorSubject;
  evidence: ForgeAnchorEvidence;
  issuedAt: string;
  issuer: string;
};

export type ForgeAnchorCommitment = {
  anchorId: Hex32;
  subjectHash: Hex32;
  evidenceHash: Hex32;
  metadataHash: Hex32;
  canonicalMetadata: string;
  metadata: ForgeAnchorMetadata;
};

export type ServiceReceiptSubject = {
  tenantSlug: string;
  agentId: string;
  founderId: string;
  serviceId: string;
  servicePath: string;
};

export type ServiceReceiptEvidence = {
  paymentTx: TransactionHash;
  network: string;
  payer: string;
  currency: string;
  amountAtomic: string;
  amountDisplay: string;
  serviceCallId: string;
  ledgerTransactionId: string;
  deliveredAt: string;
  evidenceRef: string;
};

export type ServiceReceiptAnchorInput = {
  receiptId: string;
  subject: ServiceReceiptSubject;
  evidence: ServiceReceiptEvidence;
  issuedAt: string;
  issuer: string;
  caveat: string;
};

export type ServiceReceiptMetadata = {
  schema: typeof SERVICE_RECEIPT_SCHEMA;
  receiptId: string;
  subject: ServiceReceiptSubject;
  evidence: ServiceReceiptEvidence;
  issuedAt: string;
  issuer: string;
  caveat: string;
};

export type ServiceReceiptAnchor = {
  anchorId: Hex32;
  subjectHash: Hex32;
  evidenceHash: Hex32;
  metadataHash: Hex32;
  canonicalMetadata: string;
  metadata: ServiceReceiptMetadata;
};

const hex32Pattern = /^0x[a-fA-F0-9]{64}$/;
const txHashPattern = /^0x[a-fA-F0-9]{64}$/;
const atomicAmountPattern = /^(0|[1-9][0-9]*)$/;

export function buildForgeAnchorCommitment(input: ForgeAnchorCommitmentInput): ForgeAnchorCommitment {
  assertNonEmpty("subject.agentId", input.subject.agentId);
  assertNonEmpty("subject.founderId", input.subject.founderId);
  assertHex32("subject.agentSpecHash", input.subject.agentSpecHash);
  assertTransactionHash("evidence.heartbeatTx", input.evidence.heartbeatTx);
  assertNonEmpty("evidence.network", input.evidence.network);
  assertNonEmpty("issuedAt", input.issuedAt);
  assertNonEmpty("issuer", input.issuer);

  const metadata: ForgeAnchorMetadata = {
    schema: FORGE_ANCHOR_SCHEMA,
    subject: {
      agentId: input.subject.agentId,
      founderId: input.subject.founderId,
      agentSpecHash: normalizeHex32(input.subject.agentSpecHash)
    },
    evidence: {
      heartbeatTx: normalizeTransactionHash(input.evidence.heartbeatTx),
      network: input.evidence.network,
      ...(input.evidence.serviceCallId ? { serviceCallId: input.evidence.serviceCallId } : {}),
      ...(input.evidence.ledgerTransactionId ? { ledgerTransactionId: input.evidence.ledgerTransactionId } : {}),
      ...(input.evidence.evidenceRef ? { evidenceRef: input.evidence.evidenceRef } : {})
    },
    issuedAt: input.issuedAt,
    issuer: input.issuer
  };
  const subjectHash = sha256Bytes32(metadata.subject);
  const evidenceHash = sha256Bytes32(metadata.evidence);
  const canonicalMetadata = canonicalJson(metadata);
  const metadataHash = sha256Bytes32(canonicalMetadata);
  const anchorId = sha256Bytes32({
    schema: FORGE_ANCHOR_SCHEMA,
    subjectHash,
    evidenceHash,
    metadataHash
  });

  return {
    anchorId,
    subjectHash,
    evidenceHash,
    metadataHash,
    canonicalMetadata,
    metadata
  };
}

export function buildServiceReceiptAnchor(input: ServiceReceiptAnchorInput): ServiceReceiptAnchor {
  assertNonEmpty("receiptId", input.receiptId);
  assertNonEmpty("subject.tenantSlug", input.subject.tenantSlug);
  assertNonEmpty("subject.agentId", input.subject.agentId);
  assertNonEmpty("subject.founderId", input.subject.founderId);
  assertNonEmpty("subject.serviceId", input.subject.serviceId);
  assertNonEmpty("subject.servicePath", input.subject.servicePath);
  assertTransactionHash("evidence.paymentTx", input.evidence.paymentTx);
  assertNonEmpty("evidence.network", input.evidence.network);
  assertNonEmpty("evidence.payer", input.evidence.payer);
  assertNonEmpty("evidence.currency", input.evidence.currency);
  assertAtomicAmount("evidence.amountAtomic", input.evidence.amountAtomic);
  assertNonEmpty("evidence.amountDisplay", input.evidence.amountDisplay);
  assertNonEmpty("evidence.serviceCallId", input.evidence.serviceCallId);
  assertNonEmpty("evidence.ledgerTransactionId", input.evidence.ledgerTransactionId);
  assertNonEmpty("evidence.deliveredAt", input.evidence.deliveredAt);
  assertNonEmpty("evidence.evidenceRef", input.evidence.evidenceRef);
  assertNonEmpty("issuedAt", input.issuedAt);
  assertNonEmpty("issuer", input.issuer);
  assertNonEmpty("caveat", input.caveat);

  const metadata: ServiceReceiptMetadata = {
    schema: SERVICE_RECEIPT_SCHEMA,
    receiptId: input.receiptId,
    subject: {
      tenantSlug: input.subject.tenantSlug,
      agentId: input.subject.agentId,
      founderId: input.subject.founderId,
      serviceId: input.subject.serviceId,
      servicePath: input.subject.servicePath
    },
    evidence: {
      paymentTx: normalizeTransactionHash(input.evidence.paymentTx),
      network: input.evidence.network,
      payer: input.evidence.payer,
      currency: input.evidence.currency,
      amountAtomic: input.evidence.amountAtomic,
      amountDisplay: input.evidence.amountDisplay,
      serviceCallId: input.evidence.serviceCallId,
      ledgerTransactionId: input.evidence.ledgerTransactionId,
      deliveredAt: input.evidence.deliveredAt,
      evidenceRef: input.evidence.evidenceRef
    },
    issuedAt: input.issuedAt,
    issuer: input.issuer,
    caveat: input.caveat
  };
  const subjectHash = sha256Bytes32(metadata.subject);
  const evidenceHash = sha256Bytes32(metadata.evidence);
  const canonicalMetadata = canonicalJson(metadata);
  const metadataHash = sha256Bytes32(canonicalMetadata);
  const anchorId = sha256Bytes32({
    schema: SERVICE_RECEIPT_ANCHOR_SCHEMA,
    subjectHash,
    evidenceHash,
    metadataHash
  });

  return {
    anchorId,
    subjectHash,
    evidenceHash,
    metadataHash,
    canonicalMetadata,
    metadata
  };
}

export function canonicalJson(input: unknown): string {
  return JSON.stringify(sortForCanonicalJson(input));
}

export function sha256Bytes32(input: unknown): Hex32 {
  const payload = typeof input === "string" ? input : canonicalJson(input);
  return `0x${createHash("sha256").update(payload).digest("hex")}`;
}

function normalizeHex32(value: Hex32): Hex32 {
  return value.toLowerCase() as Hex32;
}

function normalizeTransactionHash(value: TransactionHash): TransactionHash {
  return value.toLowerCase() as TransactionHash;
}

function assertHex32(field: string, value: string) {
  if (!hex32Pattern.test(value)) {
    throw new Error(`${field} must be a 32-byte hex string`);
  }
}

function assertTransactionHash(field: string, value: string) {
  if (!txHashPattern.test(value)) {
    throw new Error(`${field} must be a transaction hash`);
  }
}

function assertAtomicAmount(field: string, value: string) {
  if (!atomicAmountPattern.test(value)) {
    throw new Error(`${field} must be a non-negative atomic integer string`);
  }
}

function assertNonEmpty(field: string, value: string) {
  if (!value.trim()) {
    throw new Error(`${field} is required`);
  }
}

function sortForCanonicalJson(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(sortForCanonicalJson);
  }

  if (!input || typeof input !== "object") {
    return input;
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, sortForCanonicalJson(value)])
  );
}
