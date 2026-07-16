import { FounderInterviewInputSchema } from "@agentforge/core";
import { describe, expect, it } from "vitest";
import {
  augmentPaymentResponseBody,
  buildHealthBody,
  buildX402OutputSchema,
  server,
  writeResponseInstructions
} from "./server.js";
import { findTenant } from "./tenant-registry.js";

const forgeTenant = findTenant("forge");

describe("runtime server contract", () => {
  it("does not bind a socket as an import side effect under tests", () => {
    expect(server.listening).toBe(false);
    expect(buildHealthBody()).toMatchObject({
      ok: true,
      service: "agentforge-runtime",
      status: "production-hardening-2026-07-16"
    });
  });

  it("advertises a Forge outputSchema whose example is accepted by the real validator", () => {
    expect(forgeTenant).not.toBeNull();

    const outputSchema = buildX402OutputSchema(forgeTenant!);
    const parsed = FounderInterviewInputSchema.parse(outputSchema.exampleRequestBody);

    expect(parsed).toEqual(outputSchema.exampleRequestBody);
    expect(outputSchema.purpose).toContain("OKX tooling does not auto-fill");
    expect(outputSchema.preflightEndpoint).toBe("/svc/forge/preflight");
    expect(() =>
      FounderInterviewInputSchema.parse({
        ...outputSchema.exampleRequestBody,
        servicesOffered: []
      })
    ).toThrow();
  });

  it("adds top-level outputSchema only to tenant-scoped 402 JSON bodies", () => {
    expect(forgeTenant).not.toBeNull();

    const augmented = augmentPaymentResponseBody(
      {
        status: 402,
        headers: { "content-type": "application/json" },
        body: {
          x402Version: 1,
          accepts: []
        }
      },
      forgeTenant!
    ) as { outputSchema?: unknown };
    const nonPayment = augmentPaymentResponseBody(
      {
        status: 400,
        headers: { "content-type": "application/json" },
        body: {
          error: "bad_request"
        }
      },
      forgeTenant!
    ) as { outputSchema?: unknown };

    expect(augmented.outputSchema).toEqual(buildX402OutputSchema(forgeTenant!));
    expect(nonPayment.outputSchema).toBeUndefined();
  });

  it("writes security headers on x402 instruction responses", () => {
    expect(forgeTenant).not.toBeNull();

    const response = captureResponse();
    writeResponseInstructions(
      response,
      {
        status: 402,
        headers: { "content-type": "application/json" },
        body: {
          x402Version: 1,
          accepts: []
        }
      },
      forgeTenant!
    );

    expect(response.status).toBe(402);
    expect(response.headers).toMatchObject({
      "content-type": "application/json",
      "content-security-policy": "default-src 'none'",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY"
    });
    expect(JSON.parse(response.body)).toHaveProperty("outputSchema.exampleRequestBody");
  });
});

function captureResponse() {
  return {
    status: 0,
    headers: {} as Record<string, string>,
    body: "",
    writeHead(status: number, headers: Record<string, string>) {
      this.status = status;
      this.headers = headers;
    },
    end(body?: string | Buffer) {
      this.body = Buffer.isBuffer(body) ? body.toString("utf8") : body ?? "";
    }
  } as never as {
    status: number;
    headers: Record<string, string>;
    body: string;
    writeHead(status: number, headers: Record<string, string>): void;
    end(body?: string | Buffer): void;
  };
}
