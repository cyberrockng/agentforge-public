import { randomUUID } from "node:crypto";

export const agentforgePaymentsPackage = "payments";
export {
  appendLedgerJournal,
  assertLedgerJournalIntegrity,
  checkLedgerJournal,
  readLedgerJournal
} from "./journal.js";
export type { LedgerJournalCheck, LedgerJournalRecord } from "./journal.js";

export type Currency = "USDT";
export type LedgerDirection = "debit" | "credit";
export type ServiceCallStatus = "quoted" | "delivered";

export type SplitPolicy = {
  founderBps: number;
  forgeBps: number;
};

export type SplitResult = {
  founderAmountAtomic: string;
  forgeAmountAtomic: string;
  forgeGrossAmountAtomic: string;
  referralAmountAtomic: string;
};

export type ReferralAttribution = {
  code: string;
  beneficiaryId: string;
};

export type ReferralCredit = ReferralAttribution & {
  bps: number;
  basis: "forge_share";
  amountAtomic: string;
};

export type ServiceCall = {
  id: string;
  tenantSlug: string;
  agentId: string;
  founderId: string;
  serviceId: string;
  status: ServiceCallStatus;
  currency: Currency;
  amountAtomic: string;
  payer: string | null;
  paymentTransaction: string | null;
  network: string;
  quotedAt: string | null;
  deliveredAt: string | null;
  ledgerTransactionId: string | null;
  evidenceRef: string | null;
  referral: ReferralAttribution | null;
};

export type LedgerEntry = {
  id: string;
  account: string;
  direction: LedgerDirection;
  currency: Currency;
  amountAtomic: string;
  memo: string;
};

export type LedgerTransaction = {
  id: string;
  serviceCallId: string;
  occurredAt: string;
  currency: Currency;
  entries: LedgerEntry[];
  metadata: {
    tenantSlug: string;
    agentId: string;
    founderId: string;
    serviceId: string;
    paymentTransaction: string;
    network: string;
    splitPolicy: SplitPolicy;
    referral: ReferralCredit | null;
  };
};

export type PaidServiceCallInput = {
  tenantSlug: string;
  agentId: string;
  founderId: string;
  serviceId: string;
  amountAtomic: string;
  payer: string;
  paymentTransaction: string;
  network: string;
  occurredAt: string;
  evidenceRef?: string;
  splitPolicy?: SplitPolicy;
  referralAttribution?: ReferralAttribution | null;
  referralBps?: number;
};

export type QuotedServiceCallInput = {
  tenantSlug: string;
  agentId: string;
  founderId: string;
  serviceId: string;
  network: string;
  quotedAt: string;
  quoteNonce?: string;
  referralAttribution?: ReferralAttribution | null;
};

export type PaidServiceCallAccounting = {
  serviceCall: ServiceCall;
  ledgerTransaction: LedgerTransaction;
  split: SplitResult;
  referral: ReferralCredit | null;
};

export const AGENTFORGE_OWNED_SPLIT: SplitPolicy = {
  founderBps: 0,
  forgeBps: 10_000
};

export const DEFAULT_FOUNDER_SPLIT: SplitPolicy = {
  founderBps: 8_000,
  forgeBps: 2_000
};

export const DEFAULT_REFERRAL_BPS = 1_000;

const usdtAtomicPattern = /^\d+$/;
const txPattern = /^0x[a-fA-F0-9]{64}$/;

export function splitAmountAtomic(amountAtomic: string, policy: SplitPolicy): SplitResult {
  assertAtomicAmount(amountAtomic);
  assertSplitPolicy(policy);

  const amount = BigInt(amountAtomic);
  const founderAmount = (amount * BigInt(policy.founderBps)) / 10_000n;
  const forgeAmount = amount - founderAmount;

  return {
    founderAmountAtomic: founderAmount.toString(),
    forgeAmountAtomic: forgeAmount.toString(),
    forgeGrossAmountAtomic: forgeAmount.toString(),
    referralAmountAtomic: "0"
  };
}

export function splitPolicyForFounder(founderId: string): SplitPolicy {
  return founderId === "agentforge-core" ? AGENTFORGE_OWNED_SPLIT : DEFAULT_FOUNDER_SPLIT;
}

export function buildPaidServiceCallAccounting(input: PaidServiceCallInput): PaidServiceCallAccounting {
  assertAtomicAmount(input.amountAtomic);
  assertTransactionHash(input.paymentTransaction);

  const splitPolicy = input.splitPolicy ?? splitPolicyForFounder(input.founderId);
  const baseSplit = splitAmountAtomic(input.amountAtomic, splitPolicy);
  const referral = buildReferralCredit(baseSplit.forgeGrossAmountAtomic, input);
  const split: SplitResult = {
    founderAmountAtomic: baseSplit.founderAmountAtomic,
    forgeGrossAmountAtomic: baseSplit.forgeGrossAmountAtomic,
    referralAmountAtomic: referral?.amountAtomic ?? "0",
    forgeAmountAtomic: (
      BigInt(baseSplit.forgeGrossAmountAtomic) - BigInt(referral?.amountAtomic ?? "0")
    ).toString()
  };
  const serviceCallId = serviceCallIdForPayment(input.tenantSlug, input.paymentTransaction);
  const ledgerTransactionId = ledgerTransactionIdForPayment(input.tenantSlug, input.paymentTransaction);
  const serviceCall: ServiceCall = {
    id: serviceCallId,
    tenantSlug: input.tenantSlug,
    agentId: input.agentId,
    founderId: input.founderId,
    serviceId: input.serviceId,
    status: "delivered",
    currency: "USDT",
    amountAtomic: input.amountAtomic,
    payer: input.payer,
    paymentTransaction: input.paymentTransaction,
    network: input.network,
    quotedAt: null,
    deliveredAt: input.occurredAt,
    ledgerTransactionId,
    evidenceRef: input.evidenceRef ?? null,
    referral: input.referralAttribution ?? null
  };
  const entries = [
    {
      id: `${ledgerTransactionId}:wallet`,
      account: `asset:wallet:${input.network}:settlement`,
      direction: "debit",
      currency: "USDT",
      amountAtomic: input.amountAtomic,
      memo: `Settlement received for ${input.tenantSlug}/${input.serviceId}`
    },
    {
      id: `${ledgerTransactionId}:forge`,
      account: `revenue:forge:${input.tenantSlug}`,
      direction: "credit",
      currency: "USDT",
      amountAtomic: split.forgeGrossAmountAtomic,
      memo: "AgentForge gross platform share"
    },
    {
      id: `${ledgerTransactionId}:founder`,
      account: `liability:founder:${input.founderId}`,
      direction: "credit",
      currency: "USDT",
      amountAtomic: split.founderAmountAtomic,
      memo: "Founder payable share"
    },
    {
      id: `${ledgerTransactionId}:referral-debit`,
      account: `revenue:forge:${input.tenantSlug}:referral-credit`,
      direction: "debit",
      currency: "USDT",
      amountAtomic: referral?.amountAtomic ?? "0",
      memo: referral ? `Referral credit deducted from Forge share: ${referral.code}` : "No referral credit"
    },
    {
      id: `${ledgerTransactionId}:referral-credit`,
      account: `liability:referral:${referral?.beneficiaryId ?? "none"}`,
      direction: "credit",
      currency: "USDT",
      amountAtomic: referral?.amountAtomic ?? "0",
      memo: referral ? `Referral payable for ${referral.code}` : "No referral payable"
    }
  ] satisfies LedgerEntry[];
  const nonZeroEntries = entries.filter((entry) => entry.amountAtomic !== "0");
  const ledgerTransaction: LedgerTransaction = {
    id: ledgerTransactionId,
    serviceCallId,
    occurredAt: input.occurredAt,
    currency: "USDT",
    entries: nonZeroEntries,
    metadata: {
      tenantSlug: input.tenantSlug,
      agentId: input.agentId,
      founderId: input.founderId,
      serviceId: input.serviceId,
      paymentTransaction: input.paymentTransaction,
      network: input.network,
      splitPolicy,
      referral
    }
  };

  assertBalancedLedgerTransaction(ledgerTransaction);

  return {
    serviceCall,
    ledgerTransaction,
    split,
    referral
  };
}

export function buildQuotedServiceCall(input: QuotedServiceCallInput): ServiceCall {
  return {
    id: serviceCallIdForQuote(input.tenantSlug, input.quotedAt, input.quoteNonce),
    tenantSlug: input.tenantSlug,
    agentId: input.agentId,
    founderId: input.founderId,
    serviceId: input.serviceId,
    status: "quoted",
    currency: "USDT",
    amountAtomic: "0",
    payer: null,
    paymentTransaction: null,
    network: input.network,
    quotedAt: input.quotedAt,
    deliveredAt: null,
    ledgerTransactionId: null,
    evidenceRef: null,
    referral: input.referralAttribution ?? null
  };
}

export function assertBalancedLedgerTransaction(transaction: LedgerTransaction) {
  const totals = new Map<Currency, { debit: bigint; credit: bigint }>();

  for (const entry of transaction.entries) {
    assertAtomicAmount(entry.amountAtomic);
    const existing = totals.get(entry.currency) ?? { debit: 0n, credit: 0n };
    existing[entry.direction] += BigInt(entry.amountAtomic);
    totals.set(entry.currency, existing);
  }

  for (const [currency, total] of totals) {
    if (total.debit !== total.credit) {
      throw new Error(
        `Unbalanced ledger transaction ${transaction.id} for ${currency}: debit=${total.debit.toString()} credit=${total.credit.toString()}`
      );
    }
  }
}

export function serviceCallIdForPayment(tenantSlug: string, paymentTransaction: string) {
  return `sc_${tenantSlug}_${paymentTransaction.slice(2, 14).toLowerCase()}`;
}

export function ledgerTransactionIdForPayment(tenantSlug: string, paymentTransaction: string) {
  return `lt_${tenantSlug}_${paymentTransaction.slice(2, 14).toLowerCase()}`;
}

export function serviceCallIdForQuote(tenantSlug: string, quotedAt: string, quoteNonce?: string) {
  const timestamp = quotedAt.replace(/[^0-9]/g, "");
  const nonce = (quoteNonce ?? randomUUID()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toLowerCase();

  return `sc_${tenantSlug}_quote_${timestamp}_${nonce}`;
}

function assertAtomicAmount(amountAtomic: string) {
  if (!usdtAtomicPattern.test(amountAtomic)) {
    throw new Error(`Invalid atomic USDT amount: ${amountAtomic}`);
  }
}

function assertTransactionHash(transaction: string) {
  if (!txPattern.test(transaction)) {
    throw new Error(`Invalid payment transaction hash: ${transaction}`);
  }
}

function assertSplitPolicy(policy: SplitPolicy) {
  if (!Number.isInteger(policy.founderBps) || !Number.isInteger(policy.forgeBps)) {
    throw new Error("Split basis points must be integers.");
  }

  if (policy.founderBps < 0 || policy.forgeBps < 0 || policy.founderBps + policy.forgeBps !== 10_000) {
    throw new Error("Split basis points must be non-negative and sum to 10000.");
  }
}

function buildReferralCredit(
  forgeGrossAmountAtomic: string,
  input: PaidServiceCallInput
): ReferralCredit | null {
  const attribution = input.referralAttribution ?? null;

  if (!attribution) {
    return null;
  }

  const bps = input.referralBps ?? DEFAULT_REFERRAL_BPS;
  assertReferralBps(bps);
  assertReferralAttribution(attribution);

  const amountAtomic = ((BigInt(forgeGrossAmountAtomic) * BigInt(bps)) / 10_000n).toString();

  return {
    ...attribution,
    bps,
    basis: "forge_share",
    amountAtomic
  };
}

function assertReferralBps(bps: number) {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error("Referral basis points must be an integer between 0 and 10000.");
  }
}

function assertReferralAttribution(attribution: ReferralAttribution) {
  const pattern = /^[a-z0-9][a-z0-9-]{2,63}$/;

  if (!pattern.test(attribution.code)) {
    throw new Error(`Invalid referral code: ${attribution.code}`);
  }

  if (!pattern.test(attribution.beneficiaryId)) {
    throw new Error(`Invalid referral beneficiary id: ${attribution.beneficiaryId}`);
  }
}
