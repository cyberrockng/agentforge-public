#!/usr/bin/env node

const baseUrl = normalizeBaseUrl(
  process.argv[2] ?? process.env.AGENTFORGE_VERIFY_BASE_URL ?? "http://127.0.0.1:4010"
);
const expectedLedgerCheck = process.env.AGENTFORGE_EXPECT_LEDGER_CHECK ?? "ledger_database";
const checks = [];

try {
  await checkRuntimeAlerts(baseUrl);
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

async function checkRuntimeAlerts(base) {
  const ready = await requestJson(new URL("/ready", base), { expectedStatus: 200 });
  assertEqual(ready.body.ok, true, "/ready ok");
  const readinessCheck = ready.body.checks?.find((check) => check.name === expectedLedgerCheck);

  if (!readinessCheck) {
    throw new Error(`/ready missing expected ${expectedLedgerCheck} check`);
  }

  assertEqual(readinessCheck.ok, true, `/ready ${expectedLedgerCheck}`);
  checks.push(`/ready exposes ${expectedLedgerCheck}: ok`);

  const summary = await requestJson(new URL("/ledger/summary", base), { expectedStatus: 200 });

  for (const key of ["paidCalls", "settledAtomic", "rows"]) {
    if (!(key in summary.body)) {
      throw new Error(`/ledger/summary missing ${key}`);
    }
  }

  checks.push("/ledger/summary is readable");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json"
    }
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
    body
  };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
