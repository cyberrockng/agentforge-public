import { describe, expect, it } from "vitest";
import { buildSettledDeliveryResponse } from "./paid-delivery.js";
import { findTenant } from "./tenant-registry.js";

const tenant = findTenant("shieldcheck");
const requestBody = {
  reviewType: "phishing_scam_review",
  suspiciousContent: "Airdrop DM asks me to connect wallet and sign.",
  howReceived: "Telegram DM",
  interactionStatus: "I have not connected."
};
const deliverable = {
  title: "Phishing & Scam Review",
  verdict: "likely-scam"
};
const settlement = {
  status: "settled",
  payer: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  transaction: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  network: "eip155:196",
  amountAtomic: "400000"
};

describe("buildSettledDeliveryResponse", () => {
  it("returns the paid deliverable when ledger persistence fails after settlement", async () => {
    expect(tenant).not.toBeNull();

    const response = await buildSettledDeliveryResponse({
      tenant: tenant!,
      requestBody,
      inputSource: "request_body",
      deliverable,
      deliveredAt: "2026-07-16T12:00:00.000Z",
      recoveryEndpoint: "https://runtime.example/svc/shieldcheck/recovery",
      referralAttribution: null,
      referralBps: 1000,
      settlement,
      persistLedgerRecords: async () => {
        throw new Error("ledger volume unavailable");
      },
      persistDeliveryArchive: async () => {}
    });

    expect(response.status).toBe("delivered");
    expect(response.deliverable).toEqual(deliverable);
    expect(response.receipt).toMatchObject({ transaction: settlement.transaction });
    expect(response.ledger).toMatchObject({ persisted: false });
    expect(response.recovery).toMatchObject({ ledgerPersisted: false, archivePersisted: true });
    expect(response.bookkeepingWarning).toContain("could not persist the ledger row");
  });

  it("returns the paid deliverable when archive persistence fails after settlement", async () => {
    expect(tenant).not.toBeNull();

    const response = await buildSettledDeliveryResponse({
      tenant: tenant!,
      requestBody,
      inputSource: "payment_quote",
      quoteId: "afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb",
      deliverable,
      deliveredAt: "2026-07-16T12:00:00.000Z",
      recoveryEndpoint: "https://runtime.example/svc/shieldcheck/recovery",
      referralAttribution: null,
      referralBps: 1000,
      settlement,
      persistLedgerRecords: async () => {},
      persistDeliveryArchive: async () => {
        throw new Error("archive volume unavailable");
      }
    });

    expect(response.status).toBe("delivered");
    expect(response.ledger).toMatchObject({ persisted: true });
    expect(response.recovery).toMatchObject({
      ledgerPersisted: true,
      archivePersisted: false,
      quoteId: "afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb"
    });
    expect(response.bookkeepingWarning).toContain("Delivery archive persistence failed");
  });

  it("does not throw when settlement succeeds without a transaction hash", async () => {
    expect(tenant).not.toBeNull();

    const response = await buildSettledDeliveryResponse({
      tenant: tenant!,
      requestBody,
      inputSource: "request_body",
      deliverable,
      deliveredAt: "2026-07-16T12:00:00.000Z",
      recoveryEndpoint: "https://runtime.example/svc/shieldcheck/recovery",
      referralAttribution: null,
      referralBps: 1000,
      settlement: {
        ...settlement,
        transaction: null
      },
      persistLedgerRecords: async () => {
        throw new Error("should not write ledger");
      },
      persistDeliveryArchive: async () => {
        throw new Error("should not write archive");
      }
    });

    expect(response.status).toBe("delivered");
    expect(response.receipt).toMatchObject({ transaction: null });
    expect(response.ledger).toMatchObject({ serviceCallId: null, persisted: false });
    expect(response.recovery).toMatchObject({ recoveryId: null, ledgerPersisted: false, archivePersisted: false });
    expect(response.bookkeepingWarning).toContain("without a transaction hash");
  });
});
