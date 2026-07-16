import {
  buildPaidServiceCallAccounting,
  type LedgerJournalRecord,
  type ReferralAttribution
} from "@agentforge/payments";
import {
  buildDeliveryArchiveRecord,
  buildDeliveryRecoveryHandle,
  hashRecoveryBody,
  type DeliveryArchiveRecord
} from "./delivery-recovery.js";
import type { TenantRuntimeConfig } from "./tenant-registry.js";

export type SettledDeliveryInput = {
  tenant: TenantRuntimeConfig;
  requestBody: unknown;
  inputSource: "request_body" | "payment_quote";
  quoteId?: string;
  deliverable: unknown;
  draftAudit?: unknown;
  deliveredAt: string;
  recoveryEndpoint: string;
  referralAttribution: ReferralAttribution | null;
  referralBps: number;
  settlement: {
    status: string;
    payer: string | null;
    transaction: string | null;
    network: string;
    amountAtomic: string;
  };
  persistLedgerRecords: (records: LedgerJournalRecord[]) => Promise<void>;
  persistDeliveryArchive: (record: DeliveryArchiveRecord) => Promise<void>;
  logError?: (message: string, error: unknown) => void;
};

export async function buildSettledDeliveryResponse(input: SettledDeliveryInput) {
  const bookkeepingWarnings: string[] = [];
  const transaction = input.settlement.transaction;
  let accounting: ReturnType<typeof buildPaidServiceCallAccounting> | null = null;

  if (!transaction) {
    bookkeepingWarnings.push("x402 settlement succeeded without a transaction hash; ledger and archive persistence were skipped.");
  } else {
    try {
      accounting = buildPaidServiceCallAccounting({
        tenantSlug: input.tenant.slug,
        agentId: input.tenant.agentId,
        founderId: input.tenant.founderId,
        serviceId: input.tenant.service.serviceId,
        amountAtomic: input.settlement.amountAtomic,
        payer: input.settlement.payer ?? "unknown",
        paymentTransaction: transaction,
        network: input.settlement.network,
        occurredAt: input.deliveredAt,
        referralAttribution: input.referralAttribution,
        referralBps: input.referralBps
      });
    } catch (error) {
      input.logError?.("ledger accounting build failed after settlement", error);
      bookkeepingWarnings.push(
        "Paid response is being returned now, but AgentForge could not build ledger accounting from the settlement metadata."
      );
    }
  }

  let ledgerPersisted = false;

  if (accounting) {
    try {
      await input.persistLedgerRecords([
        {
          type: "service_call",
          recordedAt: input.deliveredAt,
          serviceCall: accounting.serviceCall
        },
        {
          type: "ledger_transaction",
          recordedAt: input.deliveredAt,
          ledgerTransaction: accounting.ledgerTransaction
        }
      ]);
      ledgerPersisted = true;
    } catch (error) {
      input.logError?.("ledger persistence failed after settlement", error);
      bookkeepingWarnings.push(
        "Paid response is being returned now, but AgentForge could not persist the ledger row. Save the receipt and response before completing/reviewing."
      );
    }
  }

  const recovery = accounting
    ? buildDeliveryRecoveryHandle({
        serviceCallId: accounting.serviceCall.id,
        paymentTransaction: transaction ?? "",
        requestBody: input.requestBody,
        recoveryEndpoint: input.recoveryEndpoint
      })
    : null;
  const recoveryBase = {
    ...(recovery ?? {
      recoveryId: null,
      requestBodySha256: hashRecoveryBody(input.requestBody),
      recoveryEndpoint: input.recoveryEndpoint,
      completeOrRefundPath:
        "Inspect this paid response now. If it is lost and no ledger/archive exists, request manual make-good delivery with the payment receipt and exact body.",
      instructions: [
        "Save this response locally before completing or reviewing the task.",
        "If recovery fails, send the payment transaction, job id, and exact JSON body for manual make-good or refund."
      ]
    }),
    archivePersisted: false,
    ledgerPersisted,
    inputSource: input.inputSource,
    ...(input.quoteId ? { quoteId: input.quoteId } : {})
  };
  const baseResponseBody: Record<string, unknown> = {
    status: "delivered",
    tenant: input.tenant.slug,
    service: input.tenant.service.title,
    deliveredAt: input.deliveredAt,
    receipt: {
      status: input.settlement.status,
      payer: input.settlement.payer,
      transaction,
      network: input.settlement.network,
      amount: input.settlement.amountAtomic
    },
    ledger: accounting
      ? {
          serviceCallId: accounting.serviceCall.id,
          transactionId: accounting.ledgerTransaction.id,
          split: accounting.split,
          referral: accounting.referral,
          persisted: ledgerPersisted
        }
      : {
          serviceCallId: null,
          transactionId: null,
          persisted: false
        },
    recovery: recoveryBase,
    deliverable: input.deliverable,
    ...(input.draftAudit ? { draftAudit: input.draftAudit } : {}),
    ...(bookkeepingWarnings.length > 0 ? { bookkeepingWarning: bookkeepingWarnings.join(" ") } : {})
  };

  if (!accounting || !transaction) {
    return baseResponseBody;
  }

  const archivedResponseBody = {
    ...baseResponseBody,
    recovery: {
      ...recoveryBase,
      archivePersisted: true
    }
  };

  try {
    await input.persistDeliveryArchive(
      buildDeliveryArchiveRecord({
        archivedAt: input.deliveredAt,
        tenantSlug: input.tenant.slug,
        serviceCallId: accounting.serviceCall.id,
        paymentTransaction: transaction,
        requestBody: input.requestBody,
        responseBody: archivedResponseBody
      })
    );
    return archivedResponseBody;
  } catch (error) {
    input.logError?.("delivery archive write failed", error);
    return {
      ...baseResponseBody,
      recovery: {
        ...recoveryBase,
        archivePersisted: false,
        archiveWarning:
          "Paid response is being returned now, but the server could not persist the recovery archive. Save the response before completing/reviewing."
      },
      bookkeepingWarning: [...bookkeepingWarnings, "Delivery archive persistence failed after settlement."].join(" ")
    };
  }
}
