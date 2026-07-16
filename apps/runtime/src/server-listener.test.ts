import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

const x402MockState = vi.hoisted(() => ({
  initializeError: null as Error | null,
  processedRequests: [] as Array<{ method: string; path: string; hasPaymentHeader: boolean }>,
  processedSettlements: [] as Array<{ path: string; responseBody: string }>
}));

vi.mock("@okxweb3/x402-core", () => ({
  OKXFacilitatorClient: class OKXFacilitatorClient {
    constructor(_config: unknown) {}
  }
}));

vi.mock("@okxweb3/x402-core/server", () => ({
  x402ResourceServer: class x402ResourceServer {
    constructor(_facilitator: unknown) {}

    register(_network: string, _scheme: unknown) {
      return this;
    }
  }
}));

vi.mock("@okxweb3/x402-evm/exact/server", () => ({
  ExactEvmScheme: class ExactEvmScheme {}
}));

vi.mock("@okxweb3/x402-core/http", () => ({
  x402HTTPResourceServer: class x402HTTPResourceServer {
    constructor(_resourceServer: unknown, _routes: unknown) {}

    async initialize() {
      if (x402MockState.initializeError) {
        throw x402MockState.initializeError;
      }
    }

    async processHTTPRequest(context: { method: string; path: string; paymentHeader?: string }) {
      x402MockState.processedRequests.push({
        method: context.method,
        path: context.path,
        hasPaymentHeader: Boolean(context.paymentHeader)
      });

      if (context.paymentHeader) {
        return {
          type: "payment-verified",
          paymentPayload: {
            resource: `https://runtime.example${context.path}`,
            payload: "test-payment"
          },
          paymentRequirements: {
            amount: "400000"
          },
          declaredExtensions: {}
        };
      }

      return {
        type: "payment-error",
        response: {
          status: 402,
          headers: { "content-type": "application/json" },
          body: {
            x402Version: 1,
            accepts: [
              {
                scheme: "exact",
                network: "eip155:196",
                asset: "USDT",
                resource: context.path
              }
            ]
          }
        }
      };
    }

    async processSettlement(
      _paymentPayload: unknown,
      paymentRequirements: { amount: string },
      _declaredExtensions: unknown,
      settlementContext: { request: { path: string }; responseBody: Buffer }
    ) {
      x402MockState.processedSettlements.push({
        path: settlementContext.request.path,
        responseBody: settlementContext.responseBody.toString("utf8")
      });

      return {
        success: true,
        status: "settled",
        transaction: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        payer: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        network: "eip155:196",
        amount: paymentRequirements.amount,
        headers: {
          "x-settlement": "mocked"
        }
      };
    }
  }
}));

const originalEnv = { ...process.env };

const forgeBody = {
  founderName: "Listener Buyer",
  expertiseArea: "OKX.AI paid endpoint reliability",
  targetCustomer: "builders testing a no-payment x402 contract",
  servicesOffered: ["contract check", "buyer-input validation"],
  boundaries: ["no fake claims", "no settlement during tests"],
  tone: "direct and practical",
  pricingPreference: "0.40 USDT launch price",
  brandName: "ListenerForge"
};

describe("runtime listener contract", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    x402MockState.initializeError = null;
    x402MockState.processedRequests = [];
    x402MockState.processedSettlements = [];
    vi.resetModules();
  });

  it("serves listener-level 200 and unpaid 402 contracts with security headers", async () => {
    const runtime = await startRuntime();

    try {
      const health = await requestJson(runtime.baseUrl, "/health", { expectedStatus: 200 });
      expect(health.body).toMatchObject({
        ok: true,
        service: "agentforge-runtime",
        status: "production-hardening-2026-07-16"
      });
      expectSecurityHeaders(health.headers);

      const info = await requestJson(runtime.baseUrl, "/svc/forge/info", { expectedStatus: 200 });
      expect(info.body).toMatchObject({
        tenant: { slug: "forge" },
        route: "/svc/forge",
        payment: "x402 exact"
      });
      expectSecurityHeaders(info.headers);

      const challenge = await requestJson(runtime.baseUrl, "/svc/forge", { expectedStatus: 402 });
      expect(challenge.body).toMatchObject({
        x402Version: 1,
        outputSchema: {
          preflightEndpoint: "/svc/forge/preflight"
        }
      });
      expect(challenge.body.outputSchema.exampleRequestBody.servicesOffered).toEqual(
        expect.arrayContaining(["launch-readiness checklist"])
      );
      expectSecurityHeaders(challenge.headers);
      expect(x402MockState.processedRequests).toEqual([
        { method: "GET", path: "/svc/forge", hasPaymentHeader: false }
      ]);
    } finally {
      await runtime.close();
    }
  });

  it("drills x402 facilitator outage as a 503 before payment", async () => {
    x402MockState.initializeError = new Error("facilitator unavailable");
    const runtime = await startRuntime();

    try {
      const response = await requestJson(runtime.baseUrl, "/svc/forge", { expectedStatus: 503 });
      expect(response.body).toMatchObject({
        error: "payment_facilitator_not_configured",
        message: "facilitator unavailable"
      });
      expectSecurityHeaders(response.headers);
      expect(x402MockState.processedRequests).toEqual([]);
    } finally {
      await runtime.close();
    }
  });

  it("drills quote-store outage as a no-payment preflight failure", async () => {
    const runtime = await startRuntime({
      AGENTFORGE_PAYMENT_QUOTE_DIR: "/dev/full"
    });

    try {
      const response = await requestJson(runtime.baseUrl, "/svc/forge/preflight", {
        expectedStatus: 503,
        method: "POST",
        body: forgeBody
      });

      expect(response.body).toMatchObject({
        ok: false,
        noPaymentAttempted: true,
        error: "payment_quote_unavailable"
      });
      expectSecurityHeaders(response.headers);
      expect(x402MockState.processedRequests).toEqual([]);
    } finally {
      await runtime.close();
    }
  });

  it("drills expired af_quote replay as a no-payment rejection", async () => {
    const runtime = await startRuntime({
      AGENTFORGE_PAYMENT_QUOTE_TTL_MS: "1"
    });

    try {
      const preflight = await requestJson(runtime.baseUrl, "/svc/forge/preflight", {
        expectedStatus: 200,
        method: "POST",
        body: forgeBody
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const replay = await requestJson(
        runtime.baseUrl,
        endpointPath(preflight.body.quote.paidEndpoint),
        {
          expectedStatus: 410,
          method: "POST",
          body: {}
        }
      );

      expect(replay.body).toMatchObject({
        error: "payment_quote_expired",
        noPaymentAttempted: true
      });
      expectSecurityHeaders(replay.headers);
      expect(x402MockState.processedRequests).toEqual([]);
    } finally {
      await runtime.close();
    }
  });

  it("drills mismatched af_quote body as a no-payment rejection", async () => {
    const runtime = await startRuntime();

    try {
      const preflight = await requestJson(runtime.baseUrl, "/svc/forge/preflight", {
        expectedStatus: 200,
        method: "POST",
        body: forgeBody
      });

      const replay = await requestJson(
        runtime.baseUrl,
        endpointPath(preflight.body.quote.paidEndpoint),
        {
          expectedStatus: 400,
          method: "POST",
          body: {
            ...forgeBody,
            brandName: "DifferentReplayBody"
          }
        }
      );

      expect(replay.body).toMatchObject({
        error: "quote_body_mismatch",
        noPaymentAttempted: true
      });
      expectSecurityHeaders(replay.headers);
      expect(x402MockState.processedRequests).toEqual([]);
    } finally {
      await runtime.close();
    }
  });

  it("settles a paid callable tenant and persists receipt, ledger, and recovery archive", async () => {
    const runtime = await startRuntime();

    try {
      const response = await requestJson(runtime.baseUrl, "/svc/shieldcheck", {
        expectedStatus: 200,
        method: "POST",
        headers: {
          "x-payment": "mock-paid-payload"
        },
        body: {
          reviewType: "phishing_scam_review",
          suspiciousContent: "Urgent airdrop DM asks me to connect wallet and sign.",
          howReceived: "Telegram DM",
          interactionStatus: "I have not connected."
        }
      });

      expect(response.headers.get("x-settlement")).toBe("mocked");
      expect(response.body).toMatchObject({
        status: "delivered",
        tenant: "shieldcheck",
        receipt: {
          status: "settled",
          transaction: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          network: "eip155:196",
          amount: "400000"
        },
        ledger: {
          serviceCallId: "sc_shieldcheck_aaaaaaaaaaaa",
          transactionId: "lt_shieldcheck_aaaaaaaaaaaa",
          persisted: true
        },
        recovery: {
          recoveryId: "sc_shieldcheck_aaaaaaaaaaaa",
          archivePersisted: true,
          ledgerPersisted: true
        },
        deliverable: {
          verdict: "likely-scam"
        }
      });
      expect(x402MockState.processedRequests).toEqual([
        { method: "POST", path: "/svc/shieldcheck", hasPaymentHeader: true }
      ]);
      expect(x402MockState.processedSettlements).toHaveLength(1);
      expect(x402MockState.processedSettlements[0].responseBody).toContain("\"status\":\"delivered\"");

      const ledgerSummary = await requestJson(runtime.baseUrl, "/ledger/summary", { expectedStatus: 200 });
      expect(ledgerSummary.body.paidCalls).toBeGreaterThanOrEqual(1);
    } finally {
      await runtime.close();
    }
  });
});

async function startRuntime(env: Record<string, string> = {}) {
  vi.resetModules();
  x402MockState.processedRequests = [];
  const root = await mkdtemp(join(tmpdir(), "agentforge-runtime-listener-"));

  Object.assign(process.env, {
    NODE_ENV: "test",
    AGENTFORGE_RUNTIME_NO_LISTEN: "1",
    OKX_API_KEY: "test-okx-key",
    OKX_SECRET_KEY: "test-okx-secret",
    OKX_PASSPHRASE: "test-okx-passphrase",
    AGENTFORGE_SETTLEMENT_ADDRESS: "0xfc9b58e81bce27c2f46558d501228d935f93e802",
    AGENTFORGE_LEDGER_PATH: join(root, "ledger.jsonl"),
    AGENTFORGE_DELIVERY_ARCHIVE_DIR: join(root, "delivery-archive"),
    AGENTFORGE_PAYMENT_QUOTE_DIR: join(root, "payment-quotes"),
    ...env
  });

  const { server } = await import("./server.js");
  await listen(server);
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await close(server);
      await rm(root, { recursive: true, force: true });
    }
  };
}

function listen(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestJson(
  baseUrl: string,
  path: string,
  options: {
    expectedStatus: number;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
) {
  const response = await fetch(new URL(path, baseUrl), {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      ...options.headers,
      ...(options.body ? { "content-type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const body = await response.json();

  expect(response.status).toBe(options.expectedStatus);

  return {
    headers: response.headers,
    body
  };
}

function expectSecurityHeaders(headers: Headers) {
  expect(headers.get("content-security-policy")).toBe("default-src 'none'");
  expect(headers.get("strict-transport-security")).toBe("max-age=31536000; includeSubDomains");
  expect(headers.get("x-content-type-options")).toBe("nosniff");
  expect(headers.get("x-frame-options")).toBe("DENY");
}

function endpointPath(endpoint: string) {
  return new URL(endpoint, "http://agentforge.local").pathname + new URL(endpoint, "http://agentforge.local").search;
}
