export type RuntimeEnv = Record<string, string | undefined>;

export type ReadinessCheck = {
  name: string;
  ok: boolean;
  message: string;
};

const okxCredentialGroups = [
  ["OKX_X402_API_KEY", "OKX_API_KEY"],
  ["OKX_X402_SECRET_KEY", "OKX_SECRET_KEY"],
  ["OKX_X402_PASSPHRASE", "OKX_PASSPHRASE"]
] as const;

const supportedStorageModes = ["single-instance-jsonl", "shared-volume-jsonl"] as const;
const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;
const developmentSettlementAddress = "0xfc9b58e81bce27c2f46558d501228d935f93e802";

export function assertProductionBootEnv(env: RuntimeEnv = process.env) {
  const checks = runtimeEnvReadinessChecks(env);
  const failures = checks.filter((check) => !check.ok);

  if (env.NODE_ENV !== "production") {
    const modelClientFailure = failures.find((check) => check.name === "model_client");
    if (modelClientFailure) {
      throw new Error(modelClientFailure.message);
    }
    return;
  }

  if (failures.length > 0) {
    throw new Error(`AgentForge runtime is not production-ready: ${failures.map((check) => check.message).join("; ")}`);
  }
}

export function runtimeEnvReadinessChecks(env: RuntimeEnv = process.env): ReadinessCheck[] {
  const storageMode = env.AGENTFORGE_STORAGE_MODE;
  const replicaCount = runtimeReplicaCount(env);
  const settlementAddress = env.AGENTFORGE_SETTLEMENT_ADDRESS;

  return [
    {
      name: "model_client",
      ok: !(env.NODE_ENV === "production" && env.MODEL_CLIENT === "test-stub"),
      message: "Refusing to boot production with test-stub model client"
    },
    {
      name: "anthropic_api_key",
      ok: Boolean(env.ANTHROPIC_API_KEY),
      message: "Missing ANTHROPIC_API_KEY"
    },
    ...okxCredentialGroups.map((group) => {
      const ok = group.some((name) => Boolean(env[name]));
      return {
        name: group[0].toLowerCase(),
        ok,
        message: `Missing ${group.join(" or ")}`
      };
    }),
    {
      name: "storage_mode",
      ok: env.NODE_ENV !== "production" || isSupportedStorageMode(storageMode),
      message:
        "Production must set AGENTFORGE_STORAGE_MODE to single-instance-jsonl or shared-volume-jsonl so ledger durability assumptions are explicit"
    },
    {
      name: "settlement_address",
      ok:
        env.NODE_ENV !== "production"
          ? settlementAddress === undefined || isEvmAddress(settlementAddress)
          : isEvmAddress(settlementAddress),
      message:
        "Production must set AGENTFORGE_SETTLEMENT_ADDRESS to the 0x EVM address that receives x402 settlement"
    },
    {
      name: "runtime_replicas",
      ok:
        env.NODE_ENV !== "production" ||
        storageMode !== "single-instance-jsonl" ||
        replicaCount === 1,
      message:
        "single-instance-jsonl requires AGENTFORGE_RUNTIME_REPLICA_COUNT=1; use shared-volume-jsonl only when every runtime process writes the same persistent volume"
    }
  ];
}

export function resolveSettlementAddress(env: RuntimeEnv = process.env) {
  const configuredAddress = env.AGENTFORGE_SETTLEMENT_ADDRESS;

  if (configuredAddress) {
    if (!isEvmAddress(configuredAddress)) {
      throw new Error("AGENTFORGE_SETTLEMENT_ADDRESS must be a 0x EVM address");
    }

    return configuredAddress;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("Missing AGENTFORGE_SETTLEMENT_ADDRESS");
  }

  return developmentSettlementAddress;
}

function isSupportedStorageMode(value: string | undefined) {
  return supportedStorageModes.some((mode) => mode === value);
}

function isEvmAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && evmAddressPattern.test(value));
}

function runtimeReplicaCount(env: RuntimeEnv) {
  const rawValue = env.AGENTFORGE_RUNTIME_REPLICA_COUNT;

  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
