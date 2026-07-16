export type VerificationRecord = {
  recordId: string;
  recordType: "birth_certificate" | "proof_of_service_receipt";
  aliases: string[];
  title: string;
  agentName: string;
  agentId: string;
  founderName: string;
  founderId: string;
  issuedAt: string;
  statusAtIssue: string;
  caveat: string;
  evidence: {
    kind: string;
    servicePath: string;
    paymentTx: string;
    network: string;
    amount: string;
    serviceCallId: string;
    ledgerTransactionId: string;
    payer?: string;
  };
  anchor?: {
    contractAddress: string;
    anchorId: string;
    anchorTx: string;
    blockNumber: string;
    anchoredAtUtc: string;
    subjectHash: string;
    evidenceHash: string;
    metadataHash: string;
  };
  pendingAnchor?: {
    contractAddress: string;
    anchorId: string;
    subjectHash: string;
    evidenceHash: string;
    metadataHash: string;
    note: string;
  };
  supersededAnchors?: Array<{
    reason: string;
    anchorId: string;
    anchorTx: string;
  }>;
};

const shieldCheckBirthCertificate: VerificationRecord = {
  recordId: "bc_shieldcheck_2026-07-13",
  recordType: "birth_certificate",
  aliases: [
    "shieldcheck",
    "agentforge-shieldcheck-01",
    "0x5bab8d702877c0aee90587003fbab09dd14faf62808a4c1336fee28d71e289f1",
    "0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a"
  ],
  title: "ShieldCheck birth certificate",
  agentName: "ShieldCheck",
  agentId: "agentforge-shieldcheck-01",
  founderName: "Abiola Apata",
  founderId: "founder-abiola-apata",
  issuedAt: "2026-07-13T21:50:00.000Z",
  statusAtIssue: "gated",
  caveat:
    "This certificate proves ShieldCheck was born from a real paid AgentForge forge call. It does not claim ShieldCheck has completed its own paid customer heartbeat.",
  evidence: {
    kind: "forge_genesis_paid_call",
    servicePath: "/svc/forge",
    paymentTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
    network: "eip155:196",
    amount: "1 USDT",
    serviceCallId: "sc_forge_b8f8787c7c13",
    ledgerTransactionId: "lt_forge_b8f8787c7c13"
  },
  anchor: {
    contractAddress: "0xfd43a18b2c09903922fa452f6813e7577c48569d",
    anchorId: "0x5bab8d702877c0aee90587003fbab09dd14faf62808a4c1336fee28d71e289f1",
    anchorTx: "0x8d17cc3d1ba5a028955d9e03d6cecc9ba9ffd1e0b6e073c96540d85dc0afd00a",
    blockNumber: "65210139",
    anchoredAtUtc: "2026-07-13T21:46:15Z",
    subjectHash: "0x35731903ee7f758d8f7e74123a069b50b52d766b434dc0aad223f34da1c719da",
    evidenceHash: "0xcd30b4203b273f10e552312b9e9c0ef79120197a6c5c55a681a898c155772600",
    metadataHash: "0xa34bb7f4cff1a6cd10433806afa4951d2a661004a8157683d0ad832a42249ba3"
  },
  supersededAnchors: [
    {
      reason: "Superseded because the first anchor used an incomplete AgentSpec snapshot hash.",
      anchorId: "0x0c02e6671071e778af4113ed1661ce019e23594bf097aa9fe50086839edef8b2",
      anchorTx: "0x045091f9630e7a8df933c48d19ccefb5ff20e12caa1c43f7d996fd546c4f1b47"
    }
  ]
};

const agentForgeFirstHeartbeatReceipt: VerificationRecord = {
  recordId: "psr_forge_b8f8787c7c13",
  recordType: "proof_of_service_receipt",
  aliases: [
    "forge-first-heartbeat",
    "sc_forge_b8f8787c7c13",
    "lt_forge_b8f8787c7c13",
    "0xc5d32389823167b3a0927992294e31a4bafc904e07b2a3bfd171495eb00c0f7a",
    "0x369e30fc61c11e8b9ccfc7a495aa310feff15fd7192ec358727e50c793f2ca9b",
    "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b"
  ],
  title: "AgentForge First Heartbeat service receipt",
  agentName: "AgentForge",
  agentId: "agentforge-3746",
  founderName: "AgentForge core",
  founderId: "agentforge-core",
  issuedAt: "2026-07-13T22:00:20.000Z",
  statusAtIssue: "delivered",
  caveat:
    "This receipt proves one real paid non-QA call to AgentForge /svc/forge. It does not prove a paid ShieldCheck customer call.",
  evidence: {
    kind: "paid_non_qa_service_call",
    servicePath: "/svc/forge",
    paymentTx: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
    network: "eip155:196",
    amount: "1 USDT",
    serviceCallId: "sc_forge_b8f8787c7c13",
    ledgerTransactionId: "lt_forge_b8f8787c7c13",
    payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802"
  },
  anchor: {
    contractAddress: "0xfd43a18b2c09903922fa452f6813e7577c48569d",
    anchorId: "0xc5d32389823167b3a0927992294e31a4bafc904e07b2a3bfd171495eb00c0f7a",
    anchorTx: "0x369e30fc61c11e8b9ccfc7a495aa310feff15fd7192ec358727e50c793f2ca9b",
    blockNumber: "65211025",
    anchoredAtUtc: "2026-07-13T22:01:01Z",
    subjectHash: "0x9c0be40f30d1415fb03f52e09312cff41547af53be90c4d0c748dea80a4a22b6",
    evidenceHash: "0x36f8bdb5d65614afe9372dd46c2e0ecd6092f6b18e37382ea1306f031ba719ba",
    metadataHash: "0xa001ad222b56dc957e501690cdd537ac6b505c7c264770ca9629f42813b22d21"
  },
  supersededAnchors: [
    {
      reason: "Superseded because local time was labeled as UTC in issuedAt.",
      anchorId: "0x273476f819b3a7763dde869b53db06d936619af24684b3f74ede2ee3270561c5",
      anchorTx: "0x635301188e5588de447c6c276711103ffb6e13a41dde1e3b91128ccf1983da02"
    }
  ]
};

const shieldCheckHeartbeatReceipt: VerificationRecord = {
  recordId: "psr_shieldcheck_642e7372000a",
  recordType: "proof_of_service_receipt",
  aliases: [
    "shieldcheck-heartbeat",
    "sc_shieldcheck_642e7372000a",
    "lt_shieldcheck_642e7372000a",
    "0x802bc0c334e571d529dc7487e6a0249f1faeafe51f1eacece9fa4ce4d48936ba",
    "0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273",
    "0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5"
  ],
  title: "ShieldCheck paid heartbeat service receipt",
  agentName: "ShieldCheck",
  agentId: "agentforge-shieldcheck-01",
  founderName: "Abiola Apata",
  founderId: "founder-abiola-apata",
  issuedAt: "2026-07-14T09:31:00.000Z",
  statusAtIssue: "controlled soft-launch",
  caveat:
    "This receipt proves one real paid non-QA call to ShieldCheck /svc/shieldcheck. It is a controlled heartbeat proof, not a guarantee of safety, revenue, OKX approval, or full public launch.",
  evidence: {
    kind: "paid_non_qa_service_call",
    servicePath: "/svc/shieldcheck",
    paymentTx: "0x642e7372000a648352d03813f5591439d774ebdf06b3429dfe0885b8edb686d5",
    network: "eip155:196",
    amount: "0.40 USDT",
    serviceCallId: "sc_shieldcheck_642e7372000a",
    ledgerTransactionId: "lt_shieldcheck_642e7372000a",
    payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802"
  },
  anchor: {
    contractAddress: "0xfd43a18b2c09903922fa452f6813e7577c48569d",
    anchorId: "0x802bc0c334e571d529dc7487e6a0249f1faeafe51f1eacece9fa4ce4d48936ba",
    anchorTx: "0xe55041d2c7c9daf5d1b3c7ebd2f743e0be2a5afbf21277e603c62a8970fb6273",
    blockNumber: "65253281",
    anchoredAtUtc: "2026-07-14T09:45:17Z",
    subjectHash: "0x9d92e1f140c458c26f9fa2f0e81890934acfd20d0cec700ff22d7f386af19968",
    evidenceHash: "0x184a1877837791437ab0c590cba2a354f889fc3173288809393282d2a9fcdf3e",
    metadataHash: "0xf1bab6c55408ab970911c39ba0955050b492a4e6e35d922cd377915871e90b8f"
  }
};

const launchKitHeartbeatReceipt: VerificationRecord = {
  recordId: "psr_launch-kit_3b103d9976a5",
  recordType: "proof_of_service_receipt",
  aliases: [
    "launch-kit-heartbeat",
    "sc_launch-kit_3b103d9976a5",
    "lt_launch-kit_3b103d9976a5",
    "0xb4cd48ad852b8a66793313bd90915fc281048ca4fad673def1f7d7842172adf9",
    "0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a"
  ],
  title: "Launch Kit paid heartbeat service receipt",
  agentName: "Launch Kit",
  agentId: "agentforge-launch-kit",
  founderName: "AgentForge core",
  founderId: "agentforge-core",
  issuedAt: "2026-07-14T10:07:41.000Z",
  statusAtIssue: "self-operated paid heartbeat",
  caveat:
    "This receipt proves one real paid non-QA call to Launch Kit /svc/launch-kit. It is a self-operated proof call for the Launch Kit tenant, not an independent customer review, OKX approval guarantee, revenue guarantee, or full public-launch claim.",
  evidence: {
    kind: "paid_non_qa_service_call",
    servicePath: "/svc/launch-kit",
    paymentTx: "0x3b103d9976a5c8d9af2b7598fdf7d9e8e65200c00dadc94a210dc9cbabdc164a",
    network: "eip155:196",
    amount: "0.45 USDT",
    serviceCallId: "sc_launch-kit_3b103d9976a5",
    ledgerTransactionId: "lt_launch-kit_3b103d9976a5",
    payer: "0xfc9b58e81bce27c2f46558d501228d935f93e802"
  },
  pendingAnchor: {
    contractAddress: "0xfd43a18b2c09903922fa452f6813e7577c48569d",
    anchorId: "0xb4cd48ad852b8a66793313bd90915fc281048ca4fad673def1f7d7842172adf9",
    subjectHash: "0xad314e3d7dde19707789f1ad3b774b819d620e9ffd7fa03572cf3eaeb279ed1d",
    evidenceHash: "0x7ed35b38adf365a0d744515dcdd628fb053249f498e6e244396f66218d1c2ef2",
    metadataHash: "0x8576930c4cda070b9e915a1f3ec55849f11d3018753d469f1e8941b1c8685b39",
    note: "Anchor commitment prepared; no X Layer anchor was broadcast for this Launch Kit receipt because this step only approved the paid proof call."
  }
};

export const verificationRecords = [
  shieldCheckBirthCertificate,
  agentForgeFirstHeartbeatReceipt,
  shieldCheckHeartbeatReceipt,
  launchKitHeartbeatReceipt
] as const satisfies readonly VerificationRecord[];

export function findVerificationRecord(id: string): VerificationRecord | null {
  const normalized = id.toLowerCase();

  return (
    verificationRecords.find(
      (record) =>
        record.recordId.toLowerCase() === normalized ||
        record.aliases.some((alias) => alias.toLowerCase() === normalized)
    ) ?? null
  );
}

export function xLayerTxUrl(txHash: string) {
  return `https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`;
}

export function xLayerAddressUrl(address: string) {
  return `https://www.okx.com/web3/explorer/xlayer/address/${address}`;
}
