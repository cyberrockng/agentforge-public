import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildForgeAnchorCommitment, buildServiceReceiptAnchor, canonicalJson, sha256Bytes32 } from "./index.js";

const firstHeartbeatTx = "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b";
const agentSpecHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("buildForgeAnchorCommitment", () => {
  it("builds stable bytes32 commitments for a real heartbeat evidence packet", () => {
    const first = buildForgeAnchorCommitment({
      subject: {
        agentId: "agentforge-3746",
        founderId: "agentforge-core",
        agentSpecHash
      },
      evidence: {
        heartbeatTx: firstHeartbeatTx,
        network: "eip155:196",
        serviceCallId: "sc_forge_b8f8787c7c13",
        ledgerTransactionId: "lt_forge_b8f8787c7c13",
        evidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md"
      },
      issuedAt: "2026-07-13T00:00:00.000Z",
      issuer: "AgentForge"
    });
    const second = buildForgeAnchorCommitment({
      issuer: "AgentForge",
      issuedAt: "2026-07-13T00:00:00.000Z",
      evidence: {
        evidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md",
        ledgerTransactionId: "lt_forge_b8f8787c7c13",
        serviceCallId: "sc_forge_b8f8787c7c13",
        network: "eip155:196",
        heartbeatTx: firstHeartbeatTx
      },
      subject: {
        founderId: "agentforge-core",
        agentSpecHash,
        agentId: "agentforge-3746"
      }
    });

    expect(first).toEqual(second);
    expect(first.anchorId).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.subjectHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.evidenceHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.metadataHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.metadata.evidence.network).toBe("eip155:196");
  });

  it("changes the anchor id when heartbeat evidence changes", () => {
    const base = buildForgeAnchorCommitment({
      subject: {
        agentId: "agentforge-3746",
        founderId: "agentforge-core",
        agentSpecHash
      },
      evidence: {
        heartbeatTx: firstHeartbeatTx,
        network: "eip155:196"
      },
      issuedAt: "2026-07-13T00:00:00.000Z",
      issuer: "AgentForge"
    });
    const changed = buildForgeAnchorCommitment({
      subject: {
        agentId: "agentforge-3746",
        founderId: "agentforge-core",
        agentSpecHash
      },
      evidence: {
        heartbeatTx: "0x1111111111111111111111111111111111111111111111111111111111111111",
        network: "eip155:196"
      },
      issuedAt: "2026-07-13T00:00:00.000Z",
      issuer: "AgentForge"
    });

    expect(changed.anchorId).not.toBe(base.anchorId);
    expect(changed.evidenceHash).not.toBe(base.evidenceHash);
  });

  it("rejects malformed hashes before anything can be anchored", () => {
    expect(() =>
      buildForgeAnchorCommitment({
        subject: {
          agentId: "agentforge-3746",
          founderId: "agentforge-core",
          agentSpecHash: "0x123" as `0x${string}`
        },
        evidence: {
          heartbeatTx: firstHeartbeatTx,
          network: "eip155:196"
        },
        issuedAt: "2026-07-13T00:00:00.000Z",
        issuer: "AgentForge"
      })
    ).toThrow("subject.agentSpecHash must be a 32-byte hex string");

    expect(() =>
      buildForgeAnchorCommitment({
        subject: {
          agentId: "agentforge-3746",
          founderId: "agentforge-core",
          agentSpecHash
        },
        evidence: {
          heartbeatTx: "not-a-tx" as `0x${string}`,
          network: "eip155:196"
        },
        issuedAt: "2026-07-13T00:00:00.000Z",
        issuer: "AgentForge"
      })
    ).toThrow("evidence.heartbeatTx must be a transaction hash");
  });
});

describe("canonicalJson", () => {
  it("sorts object keys recursively", () => {
    expect(canonicalJson({ z: 1, a: { c: 3, b: 2 } })).toBe('{"a":{"b":2,"c":3},"z":1}');
    expect(sha256Bytes32({ b: 2, a: 1 })).toBe(sha256Bytes32({ a: 1, b: 2 }));
  });
});

describe("buildServiceReceiptAnchor", () => {
  const receiptInput = {
    receiptId: "psr_forge_b8f8787c7c13",
    subject: {
      tenantSlug: "forge",
      agentId: "agentforge-3746",
      founderId: "agentforge-core",
      serviceId: "ai-agent-business-builder",
      servicePath: "/svc/forge"
    },
    evidence: {
      paymentTx: firstHeartbeatTx,
      network: "eip155:196",
      payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
      currency: "USDT",
      amountAtomic: "1000000",
      amountDisplay: "1 USDT",
      serviceCallId: "sc_forge_b8f8787c7c13",
      ledgerTransactionId: "lt_forge_b8f8787c7c13",
      deliveredAt: "2026-07-04T00:00:00.000Z",
      evidenceRef: "ops/evidence/2026-07-04-first-heartbeat.md"
    },
    issuedAt: "2026-07-13T22:30:00.000Z",
    issuer: "AgentForge",
    caveat: "This receipt proves a paid call to AgentForge /svc/forge; it is not a ShieldCheck customer call."
  } as const;

  it("builds stable bytes32 commitments for a paid non-QA service receipt", () => {
    const first = buildServiceReceiptAnchor(receiptInput);
    const second = buildServiceReceiptAnchor({
      caveat: receiptInput.caveat,
      issuer: receiptInput.issuer,
      issuedAt: receiptInput.issuedAt,
      evidence: {
        evidenceRef: receiptInput.evidence.evidenceRef,
        deliveredAt: receiptInput.evidence.deliveredAt,
        ledgerTransactionId: receiptInput.evidence.ledgerTransactionId,
        serviceCallId: receiptInput.evidence.serviceCallId,
        amountDisplay: receiptInput.evidence.amountDisplay,
        amountAtomic: receiptInput.evidence.amountAtomic,
        currency: receiptInput.evidence.currency,
        payer: receiptInput.evidence.payer,
        network: receiptInput.evidence.network,
        paymentTx: receiptInput.evidence.paymentTx
      },
      subject: {
        servicePath: receiptInput.subject.servicePath,
        serviceId: receiptInput.subject.serviceId,
        founderId: receiptInput.subject.founderId,
        agentId: receiptInput.subject.agentId,
        tenantSlug: receiptInput.subject.tenantSlug
      },
      receiptId: receiptInput.receiptId
    });

    expect(first).toEqual(second);
    expect(first.anchorId).toMatch(/^0x[a-f0-9]{64}$/);
    expect(first.metadata.schema).toBe("agentforge.service-receipt.v1");
    expect(first.metadata.evidence.amountAtomic).toBe("1000000");
    expect(first.metadata.evidence.paymentTx).toBe(firstHeartbeatTx);
  });

  it("changes the anchor id when payment evidence changes", () => {
    const base = buildServiceReceiptAnchor(receiptInput);
    const changed = buildServiceReceiptAnchor({
      ...receiptInput,
      evidence: {
        ...receiptInput.evidence,
        paymentTx: "0x2222222222222222222222222222222222222222222222222222222222222222"
      }
    });

    expect(changed.anchorId).not.toBe(base.anchorId);
    expect(changed.evidenceHash).not.toBe(base.evidenceHash);
  });

  it("rejects malformed receipt evidence", () => {
    expect(() =>
      buildServiceReceiptAnchor({
        ...receiptInput,
        evidence: {
          ...receiptInput.evidence,
          paymentTx: "not-a-tx" as `0x${string}`
        }
      })
    ).toThrow("evidence.paymentTx must be a transaction hash");

    expect(() =>
      buildServiceReceiptAnchor({
        ...receiptInput,
        evidence: {
          ...receiptInput.evidence,
          amountAtomic: "1.0"
        }
      })
    ).toThrow("evidence.amountAtomic must be a non-negative atomic integer string");
  });
});

describe("ForgeAnchor artifact", () => {
  it("contains ABI and bytecode for deployment", () => {
    const artifact = JSON.parse(
      readFileSync(join(process.cwd(), "artifacts", "ForgeAnchor.json"), "utf8")
    ) as {
      abi: Array<{ type: string; name?: string }>;
      bytecode: string;
      deployedBytecode: string;
    };

    expect(artifact.abi.some((entry) => entry.type === "function" && entry.name === "anchor")).toBe(true);
    expect(artifact.abi.some((entry) => entry.type === "event" && entry.name === "AnchorWritten")).toBe(true);
    expect(artifact.bytecode).toMatch(/^0x[0-9a-f]+$/i);
    expect(artifact.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i);
  });
});
