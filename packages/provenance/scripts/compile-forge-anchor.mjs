import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const sourceName = "contracts/ForgeAnchor.sol";
const sourcePath = resolve(repoRoot, sourceName);
const artifactPath = resolve(repoRoot, "packages/provenance/artifacts/ForgeAnchor.json");
const source = readFileSync(sourcePath, "utf8");
const compilerPackage = "solc@0.8.36";

const standardInput = {
  language: "Solidity",
  sources: {
    [sourceName]: {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"]
      }
    }
  }
};

const compile = spawnSync("npx", ["--yes", compilerPackage, "--standard-json"], {
  input: JSON.stringify(standardInput),
  encoding: "utf8",
  cwd: repoRoot
});

if (compile.status !== 0) {
  throw new Error(`solc failed:\n${compile.stderr || compile.stdout}`);
}

const jsonStart = compile.stdout.indexOf("{");
if (jsonStart === -1) {
  throw new Error(`solc did not return JSON:\n${compile.stdout}`);
}

const output = JSON.parse(compile.stdout.slice(jsonStart));
const errors = output.errors ?? [];
const fatalErrors = errors.filter((error) => error.severity === "error");

if (fatalErrors.length > 0) {
  throw new Error(fatalErrors.map((error) => error.formattedMessage).join("\n"));
}

const compiled = output.contracts?.[sourceName]?.ForgeAnchor;
if (!compiled) {
  throw new Error("ForgeAnchor contract missing from compiler output");
}

const version = spawnSync("npx", ["--yes", compilerPackage, "--version"], {
  encoding: "utf8",
  cwd: repoRoot
});

const artifact = {
  contractName: "ForgeAnchor",
  sourceName,
  compiler: {
    package: compilerPackage,
    version: version.stdout.trim()
  },
  sourceHash: `0x${createHash("sha256").update(source).digest("hex")}`,
  abi: compiled.abi,
  bytecode: `0x${compiled.evm.bytecode.object}`,
  deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
  metadata: JSON.parse(compiled.metadata)
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${artifactPath}`);
