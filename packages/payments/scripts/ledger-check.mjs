#!/usr/bin/env node
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { checkLedgerJournal, readLedgerJournal } from "../dist/index.js";

const defaultPath = process.env.AGENTFORGE_LEDGER_PATH ?? "/data/agentforge/service-ledger.jsonl";
const path = resolveLedgerPath(readPathArg(process.argv.slice(2)) ?? defaultPath);

try {
  if (!existsSync(path)) {
    throw new Error(`journal not found at ${path}`);
  }

  const records = await readLedgerJournal(path);
  const check = checkLedgerJournal(records);
  const result = {
    path,
    ...check
  };

  console.log(JSON.stringify(result, null, 2));

  if (!check.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        path,
        ok: false,
        errors: [error instanceof Error ? error.message : "Unknown ledger check error"]
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}

function readPathArg(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--path") {
      return args[index + 1];
    }

    if (arg?.startsWith("--path=")) {
      return arg.slice("--path=".length);
    }
  }

  return undefined;
}

function resolveLedgerPath(path) {
  if (isAbsolute(path)) {
    return path;
  }

  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}
