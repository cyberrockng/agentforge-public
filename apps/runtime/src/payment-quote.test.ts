import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendPaymentQuoteToEndpoint,
  createPaymentQuoteRecord,
  PaymentQuoteExpiredError,
  persistPaymentQuote,
  readPaymentQuote
} from "./payment-quote.js";

describe("payment quote store", () => {
  it("persists a short-lived quote for a validated request body", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-quote-"));

    try {
      const quote = createPaymentQuoteRecord({
        tenantSlug: "forge",
        requestBody: {
          founderName: "Buyer",
          servicesOffered: ["service packaging"]
        },
        now: new Date("2026-07-15T12:00:00.000Z"),
        ttlMs: 30 * 60 * 1000
      });

      await persistPaymentQuote(dir, quote);
      const loaded = await readPaymentQuote(dir, quote.quoteId, new Date("2026-07-15T12:05:00.000Z"));

      expect(loaded).toEqual(quote);
      expect(quote.quoteId).toMatch(/^afq_[a-f0-9]{24}_[a-f0-9]{10}$/);
      expect(quote.requestBodySha256).toHaveLength(64);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects expired quotes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agentforge-quote-"));

    try {
      const quote = createPaymentQuoteRecord({
        tenantSlug: "forge",
        requestBody: { founderName: "Expired Buyer" },
        now: new Date("2026-07-15T12:00:00.000Z"),
        ttlMs: 1_000
      });

      await persistPaymentQuote(dir, quote);

      await expect(readPaymentQuote(dir, quote.quoteId, new Date("2026-07-15T12:00:01.001Z"))).rejects.toThrow(
        PaymentQuoteExpiredError
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("builds quote-bound endpoint URLs", () => {
    expect(appendPaymentQuoteToEndpoint("https://runtime.example/svc/forge", "afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb")).toBe(
      "https://runtime.example/svc/forge?af_quote=afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb"
    );
    expect(appendPaymentQuoteToEndpoint("/svc/forge", "afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb")).toBe(
      "/svc/forge?af_quote=afq_aaaaaaaaaaaaaaaaaaaaaaaa_bbbbbbbbbb"
    );
  });
});
