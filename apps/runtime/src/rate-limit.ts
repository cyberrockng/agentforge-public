import type { IncomingMessage } from "node:http";

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export type InMemoryRateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxBuckets?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxBuckets: number;

  constructor(options: InMemoryRateLimiterOptions) {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw new Error("Rate limit must be a positive integer.");
    }

    if (!Number.isInteger(options.windowMs) || options.windowMs < 1000) {
      throw new Error("Rate limit window must be at least 1000ms.");
    }

    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.maxBuckets = options.maxBuckets ?? 10_000;

    if (!Number.isInteger(this.maxBuckets) || this.maxBuckets < this.limit) {
      throw new Error("Rate limit maxBuckets must be an integer at least as large as the limit.");
    }
  }

  check(key: string, now = Date.now()): RateLimitDecision {
    const existing = this.buckets.get(key);
    const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + this.windowMs } : existing;

    bucket.count += 1;
    this.buckets.set(key, bucket);
    this.enforceBucketCeiling(now);

    const allowed = bucket.count <= this.limit;
    const remaining = Math.max(0, this.limit - bucket.count);

    return {
      allowed,
      limit: this.limit,
      remaining,
      resetAt: bucket.resetAt,
      retryAfterMs: allowed ? 0 : Math.max(0, bucket.resetAt - now)
    };
  }

  prune(now = Date.now()) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  get bucketCount() {
    return this.buckets.size;
  }

  private enforceBucketCeiling(now: number) {
    if (this.buckets.size <= this.maxBuckets) {
      return;
    }

    this.prune(now);

    if (this.buckets.size <= this.maxBuckets) {
      return;
    }

    const oldestKeys = [...this.buckets.entries()]
      .sort(([, left], [, right]) => left.resetAt - right.resetAt)
      .map(([key]) => key);

    for (const key of oldestKeys) {
      if (this.buckets.size <= this.maxBuckets) {
        break;
      }

      this.buckets.delete(key);
    }
  }
}

export function resolveClientIp(
  request: IncomingMessage,
  options: { trustedClientIpHeader?: string | null } = {}
) {
  const configuredHeader =
    "trustedClientIpHeader" in options
      ? options.trustedClientIpHeader
      : process.env.AGENTFORGE_TRUSTED_CLIENT_IP_HEADER ?? "cf-connecting-ip";
  const trustedHeader = configuredHeader?.trim().toLowerCase() ?? "";
  const trustedHeaderValue = trustedHeader ? clientIpFromTrustedHeader(request, trustedHeader) : null;

  return trustedHeaderValue || request.socket.remoteAddress || "unknown";
}

function clientIpFromTrustedHeader(request: IncomingMessage, header: string) {
  if (header === "x-forwarded-for") {
    return lastForwardedForHop(request.headers["x-forwarded-for"]);
  }

  return headerValue(request.headers[header]);
}

function lastForwardedForHop(value: string | string[] | undefined) {
  const joined = Array.isArray(value) ? value.join(",") : value;
  const hops = joined
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return hops?.at(-1);
}

function headerValue(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}
