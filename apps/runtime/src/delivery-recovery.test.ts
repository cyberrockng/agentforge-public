import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  buildDeliveryArchiveRecord,
  buildDeliveryRecoveryHandle,
  hashRecoveryBody,
  persistDeliveryArchive,
  readDeliveryArchive,
  recoveryBodyHash
} from "./delivery-recovery.js";

describe("delivery recovery", () => {
  it("hashes request bodies canonically so key order does not break recovery", () => {
    const first = {
      founderName: "Alex",
      servicesOffered: ["scan", "audit"],
      nested: {
        b: 2,
        a: 1
      }
    };
    const second = {
      nested: {
        a: 1,
        b: 2
      },
      servicesOffered: ["scan", "audit"],
      founderName: "Alex"
    };

    expect(hashRecoveryBody(first)).toBe(hashRecoveryBody(second));
  });

  it("builds a recovery handle without exposing private deliverables", () => {
    const handle = buildDeliveryRecoveryHandle({
      serviceCallId: "sc_forge_111111111111",
      paymentTransaction: "0x1111111111111111111111111111111111111111111111111111111111111111",
      requestBody: { founderName: "Buyer" },
      recoveryEndpoint: "https://runtime.example/svc/forge/recovery"
    });

    expect(handle.recoveryId).toBe("sc_forge_111111111111");
    expect(handle.recoveryEndpoint).toContain("/svc/forge/recovery");
    expect(handle.requestBodySha256).toHaveLength(64);
    expect(JSON.stringify(handle).toLowerCase()).toContain("original json body");
    expect(handle).not.toHaveProperty("responseBody");
  });

  it("persists and reads an archived buyer response by service call id", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-recovery-"));

    try {
      const record = buildDeliveryArchiveRecord({
        archivedAt: "2026-07-14T20:00:00.000Z",
        tenantSlug: "forge",
        serviceCallId: "sc_forge_222222222222",
        paymentTransaction: "0x2222222222222222222222222222222222222222222222222222222222222222",
        requestBody: { founderName: "Buyer", servicesOffered: ["builder"] },
        responseBody: {
          status: "delivered",
          deliverable: {
            qualityReport: {
              passed: true
            }
          }
        }
      });

      await persistDeliveryArchive(dir, record);
      const recovered = await readDeliveryArchive(dir, "sc_forge_222222222222");

      expect(recovered).toEqual(record);
      expect(recoveryBodyHash({ originalBody: { servicesOffered: ["builder"], founderName: "Buyer" } })).toBe(
        record.requestBodySha256
      );
      expect(recoveryBodyHash({ requestBodySha256: record.requestBodySha256.toUpperCase() })).toBe(
        record.requestBodySha256
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
