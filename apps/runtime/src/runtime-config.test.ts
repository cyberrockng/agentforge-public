import { describe, expect, it } from "vitest";
import { assertProductionBootEnv, resolveSettlementAddress, runtimeEnvReadinessChecks } from "./runtime-config.js";

const settlementAddress = "0xfc9b58e81bce27c2f46558d501228d935f93e802";

describe("runtime production config", () => {
  it("fails production readiness when required paid-path secrets are missing", () => {
    const checks = runtimeEnvReadinessChecks({
      NODE_ENV: "production",
      MODEL_CLIENT: "anthropic"
    });

    expect(checks.filter((check) => !check.ok).map((check) => check.name)).toEqual([
      "anthropic_api_key",
      "okx_x402_api_key",
      "okx_x402_secret_key",
      "okx_x402_passphrase",
      "storage_mode",
      "settlement_address"
    ]);
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic"
      })
    ).toThrow("AgentForge runtime is not production-ready");
  });

  it("accepts production readiness when all required secret aliases are present", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "single-instance-jsonl",
        AGENTFORGE_RUNTIME_REPLICA_COUNT: "1"
      })
    ).not.toThrow();
  });

  it("always rejects production test-stub model mode", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "test-stub",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "single-instance-jsonl",
        AGENTFORGE_RUNTIME_REPLICA_COUNT: "1"
      })
    ).toThrow("test-stub");
  });

  it("rejects ambiguous single-instance storage topology in production", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "single-instance-jsonl"
      })
    ).toThrow("AGENTFORGE_RUNTIME_REPLICA_COUNT=1");
  });

  it("accepts shared-volume JSONL mode because filesystem locking protects same-volume writers", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "shared-volume-jsonl"
      })
    ).not.toThrow();
  });

  it("accepts Postgres storage mode for production and multi-replica writes", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "postgres",
        AGENTFORGE_RUNTIME_REPLICA_COUNT: "3",
        DATABASE_URL: "postgres://agentforge:secret@localhost:5432/agentforge"
      })
    ).not.toThrow();
  });

  it("rejects Postgres storage mode without a database connection string", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: settlementAddress,
        AGENTFORGE_STORAGE_MODE: "postgres"
      })
    ).toThrow("DATABASE_URL");
  });

  it("rejects an invalid production settlement address", () => {
    expect(() =>
      assertProductionBootEnv({
        NODE_ENV: "production",
        MODEL_CLIENT: "anthropic",
        ANTHROPIC_API_KEY: "anthropic-key",
        OKX_API_KEY: "okx-key",
        OKX_SECRET_KEY: "okx-secret",
        OKX_PASSPHRASE: "okx-passphrase",
        AGENTFORGE_SETTLEMENT_ADDRESS: "not-an-address",
        AGENTFORGE_STORAGE_MODE: "single-instance-jsonl",
        AGENTFORGE_RUNTIME_REPLICA_COUNT: "1"
      })
    ).toThrow("AGENTFORGE_SETTLEMENT_ADDRESS");
  });

  it("resolves the configured settlement address and keeps a local fallback outside production", () => {
    expect(resolveSettlementAddress({ NODE_ENV: "test" })).toBe(settlementAddress);
    expect(
      resolveSettlementAddress({
        NODE_ENV: "production",
        AGENTFORGE_SETTLEMENT_ADDRESS: "0x1111111111111111111111111111111111111111"
      })
    ).toBe("0x1111111111111111111111111111111111111111");
  });
});
