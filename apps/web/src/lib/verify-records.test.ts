import { describe, expect, it } from "vitest";
import { findVerificationRecord, verificationRecords } from "./verify-records.js";

describe("verification records", () => {
  it("publishes the ShieldCheck birth certificate by record id, agent id, anchor id, and tx", () => {
    const record = verificationRecords[0]!;

    expect(record.recordId).toBe("bc_shieldcheck_2026-07-13");
    expect(findVerificationRecord("bc_shieldcheck_2026-07-13")?.agentName).toBe("ShieldCheck");
    expect(findVerificationRecord("agentforge-shieldcheck-01")?.recordId).toBe(record.recordId);
    expect(findVerificationRecord(record.anchor!.anchorId)?.recordId).toBe(record.recordId);
    expect(findVerificationRecord(record.anchor!.anchorTx)?.recordId).toBe(record.recordId);
  });

  it("keeps the certificate caveat explicit", () => {
    const record = findVerificationRecord("shieldcheck");

    expect(record?.caveat).toContain("does not claim ShieldCheck has completed its own paid customer heartbeat");
    expect(record?.supersededAnchors?.[0]?.reason).toContain("incomplete AgentSpec snapshot hash");
  });

  it("publishes the first proof-of-service receipt by receipt id, service call, payment tx, anchor id, and anchor tx", () => {
    const record = findVerificationRecord("psr_forge_b8f8787c7c13");

    expect(record?.recordType).toBe("proof_of_service_receipt");
    expect(record?.agentName).toBe("AgentForge");
    expect(findVerificationRecord("sc_forge_b8f8787c7c13")?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.evidence.paymentTx)?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.anchor!.anchorId)?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.anchor!.anchorTx)?.recordId).toBe(record?.recordId);
  });

  it("publishes the ShieldCheck paid heartbeat receipt by receipt id, service call, payment tx, anchor id, and anchor tx", () => {
    const record = findVerificationRecord("psr_shieldcheck_642e7372000a");

    expect(record?.recordType).toBe("proof_of_service_receipt");
    expect(record?.agentName).toBe("ShieldCheck");
    expect(record?.evidence.servicePath).toBe("/svc/shieldcheck");
    expect(record?.evidence.paymentTx).toBe("0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5");
    expect(findVerificationRecord("sc_shieldcheck_642e7372000a")?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.anchor!.anchorId)?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.anchor!.anchorTx)?.recordId).toBe(record?.recordId);
    expect(record?.anchor?.blockNumber).toBe("65253281");
  });

  it("publishes the Launch Kit paid heartbeat receipt with pending anchor disclosure", () => {
    const record = findVerificationRecord("psr_launch-kit_3b103d9976a5");

    expect(record?.recordType).toBe("proof_of_service_receipt");
    expect(record?.agentName).toBe("Launch Kit");
    expect(record?.evidence.servicePath).toBe("/svc/launch-kit");
    expect(record?.evidence.paymentTx).toBe("0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a");
    expect(findVerificationRecord("sc_launch-kit_3b103d9976a5")?.recordId).toBe(record?.recordId);
    expect(findVerificationRecord(record!.pendingAnchor!.anchorId)?.recordId).toBe(record?.recordId);
    expect(record?.pendingAnchor?.note).toContain("no X Layer anchor was broadcast");
    expect(record?.caveat).toContain("self-operated proof call");
  });

  it("keeps the service receipt caveat explicit", () => {
    const record = findVerificationRecord("forge-first-heartbeat");

    expect(record?.caveat).toContain("does not prove a paid ShieldCheck customer call");
    expect(record?.supersededAnchors?.[0]?.reason).toContain("local time was labeled as UTC");
  });
});
