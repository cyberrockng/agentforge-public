# T4.1 ForgeAnchor contract — code/artifact dry-run

Date: 2026-07-13  
Builder: Codex

## Scope completed

- Added `contracts/ForgeAnchor.sol`.
- Added deterministic provenance commitment helpers in `packages/provenance`.
- Added compiler script for `packages/provenance/artifacts/ForgeAnchor.json`.
- Added dry-run/broadcast deployment script.
- Added provenance tests for:
  - stable canonical commitments,
  - changed heartbeat evidence changing the anchor id,
  - malformed hash rejection,
  - canonical JSON ordering,
  - artifact ABI/bytecode presence.

## Contract shape

- Owner-only append function: `anchor(anchorId, subjectHash, evidenceHash, metadataHash)`.
- Stores only bytes32 commitments plus issuer and timestamp.
- Emits `AnchorWritten`.
- Prevents zero bytes32 inputs.
- Prevents duplicate `anchorId`.
- Human-readable birth certificate metadata remains off-chain.

## Artifact

```json
{
  "contractName": "ForgeAnchor",
  "compiler": {
    "package": "solc@0.8.36",
    "version": "0.8.36+commit.8a079791.Emscripten.clang"
  },
  "sourceHash": "0x029ae28739dfea198a6f3182b948765caa5e97aa2aa529232848a1e7f3851eb5",
  "abiEntries": 10,
  "bytecodeBytes": 1436,
  "deployedBytecodeBytes": 1266
}
```

## Validation

```bash
npm run compile:anchor --workspace @agentforge/provenance
npm test --workspace @agentforge/provenance
npm run typecheck --workspace @agentforge/provenance
npm run build --workspace @agentforge/provenance
FORGE_ANCHOR_OWNER=0xfc9b58e81bce27c2f46558d501228d935f93e802 npm run deploy:anchor --workspace @agentforge/provenance
npm audit --omit=optional --audit-level=high
```

Dry-run deployment output:

```json
{
  "mode": "dry-run",
  "chainId": 196,
  "owner": "0xfc9b58e81bce27c2f46558d501228d935f93e802",
  "contractName": "ForgeAnchor",
  "bytecodeBytes": 1436,
  "deployCalldataBytes": 1468,
  "next": "Run with --broadcast only after H2 gas/funding and explicit human approval."
}
```

`npm audit --omit=optional --audit-level=high` exits 0. The remaining audit output is the known moderate Next/PostCSS advisory.

## H2 broadcast/funding readiness check

Date: 2026-07-13

Read-only checks performed:

```bash
onchainos wallet status
onchainos wallet addresses --chain xlayer
onchainos wallet balance --chain xlayer
onchainos gateway gas --chain xlayer
FORGE_ANCHOR_OWNER=0xfc9b58e81bce27c2f46558d501228d935f93e802 npm run deploy:anchor --workspace @agentforge/provenance
```

Findings:

- OKX Agentic Wallet CLI is authenticated.
- X Layer deployment/owner address: `0xfc9b58e81bce27c2f46558d501228d935f93e802`.
- X Layer token balance includes `2.512082` USDT and `0.001495` USDC.
- No native OKB balance was returned for the deployment address.
- Raw ForgeAnchor contract deployment gas estimate on X Layer:
  - gas: `333030`
  - gas price: `20000001` wei
  - estimated native cost: `6660600333030` wei = approximately `0.00000666060033303` OKB
- Local and Railway runtime environments do not currently contain `FORGE_WALLET_KEY`, `XLAYER_RPC_URL`, or `FORGE_ANCHOR_OWNER`.
- The OKX wallet CLI can send assets and call existing contracts, but the current CLI surface does not expose raw contract creation. The current repo broadcast path requires either a secure local deploy signer plus `XLAYER_RPC_URL`, or a pre-signed deployment transaction for gateway broadcast.

H2 status:

- USDT funding is present for the recalibrated proof-call budget.
- Initial check found ForgeAnchor broadcast gas was not funded because native OKB was `0`.
- The user approved converting existing USDT to OKB for anchor gas.

## H2 anchor gas funding completed

Swap:

```bash
onchainos swap execute --from usdt --to okb --readable-amount 0.01 --chain xlayer --wallet 0xfc9b58e81bce27c2f46558d501228d935f93e802 --gas-level average
```

Result:

- Status: `SUCCESS`
- Transaction hash: `0xa47be794173fce59a8dae41f2dc9abe5c00924047855127e3d22e8d36b877a99`
- Sent: `0.01` USDT
- Received: `0.000124197817697228` OKB
- Service charge: `0.000015260310678236` OKB
- Post-swap X Layer balance:
  - `2.502082` USDT
  - `0.000124197817697228` OKB
  - `0.001495` USDC

H2 funding conclusion:

- H2 is funded for the ForgeAnchor gas requirement.
- The OKB balance is above the observed raw deployment estimate of approximately `0.00000666060033303` OKB.
- The remaining T4.1 blocker is not funding; it is the secure deploy path: local `FORGE_WALLET_KEY` + `XLAYER_RPC_URL`, or a pre-signed deployment transaction.

## X Layer deployment completed

Date: 2026-07-13

Route:

- Generated a temporary local deployer for the contract creation transaction.
- Sent `0.00005` OKB from the AgentForge X Layer wallet to the temporary deployer.
- Signed the ForgeAnchor contract creation transaction locally with the temporary deployer.
- Broadcast the signed transaction through `onchainos gateway broadcast`.
- Set the immutable ForgeAnchor owner to the AgentForge X Layer wallet.

Deployment result:

- Status: `success`
- Contract: `0xfd43a18b2c09903922fa452f6813e7577c48569d`
- Deploy tx: `0xe79cbdc5500fe61cfde993b19882d7d9cd2b70b0271ac10ec3eaff3e6ca7ab3f`
- Block: `65209391`
- Gas used: `329250`
- Deployer: `0x2Ab2cC3dCbc2Ff69EbfC4d64bb8B175B1f200BDE`
- Funding tx to deployer: `0xd99ce3644000677802be0f530d71ec83008a14b7a7302f2b20d6596d0f8cb401`
- Deployed bytecode: `1266` bytes
- `owner()` verified by RPC: `0xfc9b58e81BcE27c2f46558D501228D935f93e802`

Cleanup:

- Attempted to sweep deployer dust back to the AgentForge wallet.
- Sweep tx: `0xb0b690bd74ed37911e1a29a05a86e465aa7c6398e34e1bcad0a8e3340d4b67b6`
- Sweep status: `reverted`
- Final temporary deployer balance: `0.00004299499964975` OKB.
- The temporary deployer private key was intentionally not printed or committed. Because the sweep failed after the in-memory key was discarded, the remaining deployer dust is treated as unrecoverable.

Post-deployment AgentForge X Layer balance:

- `2.502082` USDT
- `0.000074197817697228` OKB
- `0.001495` USDC

T4.1 conclusion:

- ForgeAnchor is deployed on X Layer and owned by the AgentForge wallet.
- T4.1 is complete.
- Next product step is T4.2: create and anchor the first birth certificate against this contract.

## Boundary

- Wallet/onchain commands included read-only status/address/balance/gas checks, one user-approved `0.01` USDT to OKB swap for anchor gas, one `0.00005` OKB send to the temporary deployer, one ForgeAnchor deployment broadcast, and one failed dust-sweep broadcast.
- No user private key was read.
- A temporary deployer private key was generated in-memory only and was not printed or committed.
- The failed dust sweep left unrecoverable deployer dust of `0.00004299499964975` OKB.
