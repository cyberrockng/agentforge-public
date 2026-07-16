#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(
  process.argv[2] ?? process.env.AGENTFORGE_VERIFY_BASE_URL ?? "http://127.0.0.1:4010"
);

const requiredSecurityHeaders = {
  "content-security-policy": "default-src 'none'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

const checks = [];

try {
  await verifyRuntimeContract(baseUrl);
  for (const check of checks) {
    console.log(`PASS ${check}`);
  }
} catch (error) {
  for (const check of checks) {
    console.log(`PASS ${check}`);
  }
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

async function verifyRuntimeContract(base) {
  const health = await requestJson(new URL("/health", base), { expectedStatus: 200 });
  assertSecurityHeaders(health.headers, "/health");
  assertEqual(health.body.service, "agentforge-runtime", "/health service");
  checks.push("/health returns runtime liveness with security headers");

  const ready = await requestJson(new URL("/ready", base), { expectedStatus: 200 });
  assertSecurityHeaders(ready.headers, "/ready");
  assertEqual(ready.body.ok, true, "/ready ok");
  checks.push("/ready returns production readiness");

  const info = await requestJson(new URL("/svc/forge/info", base), { expectedStatus: 200 });
  assertSecurityHeaders(info.headers, "/svc/forge/info");
  assertEqual(info.body.tenant.slug, "forge", "/svc/forge/info tenant");
  checks.push("/svc/forge/info returns buyer-facing service info");

  const challenge = await requestJson(new URL("/svc/forge", base), { expectedStatus: 402 });
  assertSecurityHeaders(challenge.headers, "/svc/forge");
  assertObject(challenge.body.outputSchema, "/svc/forge outputSchema");
  assertObject(challenge.body.outputSchema.exampleRequestBody, "/svc/forge outputSchema.exampleRequestBody");
  assertIncludes(
    challenge.body.outputSchema.purpose,
    "OKX tooling does not auto-fill",
    "/svc/forge outputSchema purpose"
  );
  checks.push("/svc/forge unpaid challenge includes truthful outputSchema");

  const preflight = await requestJson(new URL("/svc/forge/preflight", base), {
    expectedStatus: 200,
    method: "POST",
    body: challenge.body.outputSchema.exampleRequestBody
  });
  assertSecurityHeaders(preflight.headers, "/svc/forge/preflight");
  assertEqual(preflight.body.bodyReadyForPayment, true, "/svc/forge/preflight bodyReadyForPayment");
  assertIncludes(preflight.body.quote.paidEndpoint, "af_quote=", "/svc/forge/preflight quote");
  checks.push("advertised outputSchema example is accepted by preflight");

  const malformedBody = {
    ...challenge.body.outputSchema.exampleRequestBody,
    servicesOffered: []
  };
  const malformed = await requestJson(new URL("/svc/forge/preflight", base), {
    expectedStatus: 400,
    method: "POST",
    body: malformedBody
  });
  assertSecurityHeaders(malformed.headers, "/svc/forge/preflight malformed");
  assertEqual(malformed.body.error, "invalid_request_body", "/svc/forge/preflight malformed error");
  checks.push("malformed Forge body is rejected before payment");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${url.pathname} returned non-JSON body: ${text.slice(0, 160)}`);
  }

  if (response.status !== options.expectedStatus) {
    throw new Error(
      `${url.pathname} expected HTTP ${options.expectedStatus}, got ${response.status}: ${JSON.stringify(body)}`
    );
  }

  return {
    headers: response.headers,
    body
  };
}

function assertSecurityHeaders(headers, path) {
  for (const [name, expected] of Object.entries(requiredSecurityHeaders)) {
    assertEqual(headers.get(name), expected, `${path} ${name}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(actual, expected, label) {
  if (typeof actual !== "string" || !actual.includes(expected)) {
    throw new Error(`${label} expected to include ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} expected object, got ${JSON.stringify(value)}`);
  }
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
