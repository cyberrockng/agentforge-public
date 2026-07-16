import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter, resolveClientIp } from "./rate-limit.js";

describe("InMemoryRateLimiter", () => {
  it("allows requests within the window and rejects the first over-limit request", () => {
    const limiter = new InMemoryRateLimiter({ limit: 2, windowMs: 10_000 });

    expect(limiter.check("ip:tenant", 1000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("ip:tenant", 1001)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.check("ip:tenant", 1002)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets after the configured window", () => {
    const limiter = new InMemoryRateLimiter({ limit: 1, windowMs: 10_000 });

    expect(limiter.check("ip:tenant", 1000).allowed).toBe(true);
    expect(limiter.check("ip:tenant", 1001).allowed).toBe(false);
    expect(limiter.check("ip:tenant", 11_000).allowed).toBe(true);
  });

  it("prunes expired buckets and caps bucket growth", () => {
    const limiter = new InMemoryRateLimiter({ limit: 1, windowMs: 10_000, maxBuckets: 3 });

    limiter.check("ip:a", 1000);
    limiter.check("ip:b", 1000);
    limiter.check("ip:c", 1000);
    limiter.check("ip:d", 1000);

    expect(limiter.bucketCount).toBeLessThanOrEqual(3);

    limiter.prune(11_000);
    expect(limiter.bucketCount).toBe(0);
  });
});

describe("resolveClientIp", () => {
  it("does not trust spoofed x-forwarded-for by default", () => {
    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.4, 10.0.0.1"
      },
      socket: {
        remoteAddress: "10.0.0.2"
      }
    };

    expect(resolveClientIp(request as never, { trustedClientIpHeader: null })).toBe("10.0.0.2");
  });

  it("uses an explicit trusted platform header when configured", () => {
    const request = {
      headers: {
        "cf-connecting-ip": "203.0.113.4",
        "x-forwarded-for": "198.51.100.10"
      },
      socket: {
        remoteAddress: "10.0.0.2"
      }
    };

    expect(resolveClientIp(request as never, { trustedClientIpHeader: "cf-connecting-ip" })).toBe("203.0.113.4");
  });

  it("uses the nearest forwarded hop only when x-forwarded-for is explicitly trusted", () => {
    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.4, 10.0.0.1"
      },
      socket: {
        remoteAddress: "10.0.0.2"
      }
    };

    expect(resolveClientIp(request as never, { trustedClientIpHeader: "x-forwarded-for" })).toBe("10.0.0.1");
  });
});
