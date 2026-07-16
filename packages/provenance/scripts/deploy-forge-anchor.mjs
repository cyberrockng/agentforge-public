import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, defineChain, encodeDeployData, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const artifactPath = resolve(repoRoot, "packages/provenance/artifacts/ForgeAnchor.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const shouldBroadcast = process.argv.includes("--broadcast");
const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.XLAYER_RPC_URL ?? "https://rpc.xlayer.tech"]
    }
  }
});
const privateKey = process.env.FORGE_WALLET_KEY;
const account = privateKey ? privateKeyToAccount(normalizePrivateKey(privateKey)) : null;
const owner = process.env.FORGE_ANCHOR_OWNER ?? account?.address;

if (!owner) {
  throw new Error("Set FORGE_ANCHOR_OWNER for dry-run, or FORGE_WALLET_KEY for broadcast deployment.");
}

const deployData = encodeDeployData({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [owner]
});

if (!shouldBroadcast) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        chainId: xLayer.id,
        owner,
        contractName: artifact.contractName,
        compiler: artifact.compiler,
        bytecodeBytes: byteLength(artifact.bytecode),
        deployCalldataBytes: byteLength(deployData),
        next: "Run with --broadcast only after H2 gas/funding and explicit human approval."
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (!privateKey) {
  throw new Error("FORGE_WALLET_KEY is required when --broadcast is used.");
}

if (!process.env.XLAYER_RPC_URL) {
  throw new Error("XLAYER_RPC_URL is required when --broadcast is used.");
}

const walletClient = createWalletClient({
  account,
  chain: xLayer,
  transport: http(process.env.XLAYER_RPC_URL)
});
const publicClient = createPublicClient({
  chain: xLayer,
  transport: http(process.env.XLAYER_RPC_URL)
});
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
  args: [owner]
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });

console.log(
  JSON.stringify(
    {
      mode: "broadcast",
      chainId: xLayer.id,
      transactionHash: hash,
      contractAddress: receipt.contractAddress,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      owner
    },
    null,
    2
  )
);

function normalizePrivateKey(value) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function byteLength(hex) {
  return (hex.length - 2) / 2;
}
