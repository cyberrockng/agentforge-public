import { z } from "zod";
import type { TenantRuntimeConfig } from "./tenant-registry.js";

export const ShieldCheckInputSchema = z.object({
  reviewType: z.enum(["phishing_scam_review", "wallet_security_checkup", "token_approval_audit"]),
  suspiciousContent: z.string().min(1).optional(),
  walletContext: z.string().min(1).optional(),
  publicWalletAddress: z.string().min(1).optional(),
  howReceived: z.string().min(1).optional(),
  interactionStatus: z.string().min(1).optional()
});

export type ShieldCheckInput = z.infer<typeof ShieldCheckInputSchema>;

export const shieldCheckInputSchema = {
  type: "object",
  required: ["reviewType"],
  properties: {
    reviewType: {
      type: "string",
      enum: ["phishing_scam_review", "wallet_security_checkup", "token_approval_audit"],
      guidance: "Choose the ShieldCheck review to run."
    },
    suspiciousContent: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "URL, message text, screenshot description, claim prompt, or transaction request to review."
    },
    walletContext: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "General wallet setup context. Never include seed phrases, private keys, or secret credentials."
    },
    publicWalletAddress: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "Public wallet address only, for approval-risk review. Never include private keys."
    },
    howReceived: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "How the suspicious item was received: DM, email, pop-up, airdrop claim, website, etc."
    },
    interactionStatus: {
      type: "string",
      minLength: 1,
      optional: true,
      guidance: "Whether the user already clicked, signed, connected, sent funds, or took no action."
    }
  }
} as const;

export const shieldCheckExampleRequestBody = {
  reviewType: "phishing_scam_review",
  suspiciousContent: "Airdrop claim page asking me to connect wallet and sign a message.",
  howReceived: "Telegram DM",
  interactionStatus: "I have not connected or signed yet."
};

export type ShieldCheckDeliverable = {
  title: string;
  reviewType: ShieldCheckInput["reviewType"];
  verdict: "likely-scam" | "suspicious" | "needs-more-context";
  refusal?: true;
  refusedRequest?: string;
  redFlags: string[];
  safeNextSteps: string[];
  boundaries: string[];
};

export function buildShieldCheckDeliverable(
  tenant: TenantRuntimeConfig,
  input: ShieldCheckInput
): ShieldCheckDeliverable {
  const content = [
    input.suspiciousContent,
    input.walletContext,
    input.publicWalletAddress,
    input.howReceived,
    input.interactionStatus
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const redFlags = collectRedFlags(content);
  const unsafeInstruction = detectUnsafeInstruction(input);

  if (unsafeInstruction) {
    return {
      title: tenant.service.title,
      reviewType: input.reviewType,
      verdict: "needs-more-context",
      refusal: true,
      refusedRequest: unsafeInstruction.label,
      redFlags: [...new Set([...redFlags, unsafeInstruction.redFlag])],
      safeNextSteps: [
        `I cannot ${unsafeInstruction.refusal}.`,
        "Use ShieldCheck only for defensive phishing, scam, wallet-risk, and token-approval review.",
        "Provide public, non-secret evidence such as a suspicious URL, message text, transaction prompt, or public wallet address.",
        "Keep control of wallet actions, listing changes, and account access with the owner."
      ],
      boundaries: tenant.refusalBoundaries
    };
  }

  return {
    title: tenant.service.title,
    reviewType: input.reviewType,
    verdict: redFlags.length >= 2 ? "likely-scam" : redFlags.length === 1 ? "suspicious" : "needs-more-context",
    redFlags,
    safeNextSteps: [
      "Do not share seed phrases, private keys, OTPs, or recovery files.",
      "Do not sign a transaction or message unless you understand the exact permission being granted.",
      "Use a clean browser session and verify the official project domain from independent sources.",
      "If a wallet has already connected, review and revoke unnecessary token approvals from a trusted tool.",
      "Move slowly; urgent rewards, surprise airdrops, and private DM links are common scam patterns."
    ],
    boundaries: tenant.refusalBoundaries
  };
}

function collectRedFlags(content: string): string[] {
  const flags: string[] = [];

  if (/seed|private key|recovery phrase|mnemonic/.test(content)) {
    flags.push("The request involves secret wallet credentials or recovery material.");
  }

  if (/airdrop|reward|claim|free|urgent|limited/.test(content)) {
    flags.push("The offer uses reward or urgency language that often appears in phishing flows.");
  }

  if (/dm|telegram|discord|whatsapp|inbox/.test(content)) {
    flags.push("The contact path is a private or social message rather than a verified official channel.");
  }

  if (/sign|approve|connect|permit|allowance/.test(content)) {
    flags.push("The flow asks for wallet connection, signature, approval, or spending permission.");
  }

  return flags;
}

type UnsafeInstruction = {
  label: string;
  refusal: string;
  redFlag: string;
};

function detectUnsafeInstruction(input: ShieldCheckInput): UnsafeInstruction | null {
  const text = [
    input.suspiciousContent,
    input.walletContext,
    input.publicWalletAddress,
    input.howReceived,
    input.interactionStatus
  ]
    .filter(Boolean)
    .join(" ");
  const actionableText = text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => !isBoundaryReminder(sentence))
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!actionableText) {
    return null;
  }

  if (matches(actionableText, [
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:tell|state|claim|promise|guarantee|assure)\b.{0,120}\b(?:okx(?:\.ai)? approval|okx has approved|approved this tenant|verified every claim|guaranteed revenue|revenue after listing)\b/,
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)guarantee(?:s|d)?\b.{0,80}\b(?:okx(?:\.ai)? approval|approval|revenue)\b/
  ])) {
    return {
      label: "unsupported approval or revenue claim",
      refusal: "claim OKX approval, verified claims, guaranteed approval, or guaranteed revenue without evidence",
      redFlag: "The request asks for unsupported approval or revenue claims."
    };
  }

  if (matches(actionableText, [
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:ask|tell|request|collect|process|store)\b.{0,120}\b(?:private key|seed phrase|recovery phrase|mnemonic|okx api secret|api secret|wallet password|otp|recovery file)\b/,
    /\b(?:make|have)\s+the\s+buyer\b.{0,80}\b(?:paste|share|send|reveal)\b.{0,80}\b(?:private key|seed phrase|recovery phrase|mnemonic|api secret|wallet password)\b/
  ])) {
    return {
      label: "secret credential request",
      refusal: "request, process, store, or reveal seed phrases, private keys, API secrets, wallet passwords, OTPs, or recovery files",
      redFlag: "The request tries to involve secret wallet or account credentials."
    };
  }

  if (matches(actionableText, [
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:invent|fabricate|fake|make up|create fake)\b.{0,140}\b(?:founder credentials|enterprise customers|customers|five-star reviews|reviews|traction|payment proof|transaction hash|birth certificate|anchor)\b/,
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:claim|state|say|assert)\b.{0,160}\b(?:paying customers|okx reviews|transaction hash|birth certificate|anchored on x layer)\b/
  ])) {
    return {
      label: "fabricated evidence or traction",
      refusal: "invent founder credentials, customers, reviews, traction, transaction hashes, receipts, or provenance anchors",
      redFlag: "The request asks ShieldCheck to fabricate evidence or public claims."
    };
  }

  if (matches(actionableText, [
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:offer|promise|agree|attempt)\b.{0,120}\b(?:sign transactions|move buyer funds|move funds|recover stolen funds|custody funds)\b/,
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:sign|send|transfer|move|recover)\b.{0,100}\b(?:transaction|buyer funds|funds|stolen funds|wallet assets)\b/
  ])) {
    return {
      label: "wallet custody or recovery operation",
      refusal: "sign transactions, move buyer funds, custody assets, or promise direct recovery of stolen funds",
      redFlag: "The request asks for wallet control, custody, signing, or recovery promises."
    };
  }

  if (matches(actionableText, [
    /(?:^|\b(?:please|can you|could you|i need you to|you should)\s+)(?:log into|login to|access|directly update|update|edit|change)\b.{0,140}\b(?:okx account|builder account|marketplace listing|listing|asp listing)\b/,
    /\bshared account access\b/
  ])) {
    return {
      label: "direct account or listing control",
      refusal: "log into accounts, take shared account access, or directly update OKX listings for the owner",
      redFlag: "The request asks for direct account or listing control."
    };
  }

  if (matches(actionableText, [
    /\b(?:ignore previous instructions|ignore all previous instructions|print|reveal|show|dump)\b.{0,140}\b(?:hidden system prompt|system prompt|developer message|runtime environment|environment variables|env vars|anthropic_api_key|okx_x402_secret_key)\b/,
    /\b(?:not reveal|cannot reveal|do not reveal)\b.{0,120}\b(?:system prompt|environment variables|env vars)\b/
  ])) {
    return {
      label: "prompt or environment extraction",
      refusal: "reveal hidden prompts, developer instructions, runtime environment variables, or secret configuration",
      redFlag: "The request attempts prompt extraction or environment disclosure."
    };
  }

  if (matches(actionableText, [
    /\b(?:you are now|act as|become)\b.{0,80}\b(?:agentforge root admin|root admin|system admin|developer)\b/,
    /\b(?:disable x402|bypass payment checks|payment checks bypassed|mark this tenant public|mark .* public)\b/
  ])) {
    return {
      label: "role override or payment bypass",
      refusal: "accept role override instructions, disable x402, bypass payment checks, or mark a tenant public",
      redFlag: "The request tries to override role, payment, or status controls."
    };
  }

  if (matches(actionableText, [
    /\b(?:use|access|read|leak|dump|reveal)\b.{0,120}\b(?:another tenant|other tenant|private records|internal customer data|private tenant data)\b/,
    /\b(?:another tenant|other tenant)\b.{0,120}\b(?:private records|internal customer data|private tenant data|leak)\b/
  ])) {
    return {
      label: "tenant data crossing",
      refusal: "use, reveal, or leak another tenant's private records or internal customer data",
      redFlag: "The request attempts to cross tenant data boundaries."
    };
  }

  return null;
}

function matches(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function isBoundaryReminder(sentence: string) {
  return /\b(?:do not|don't|never|must never|cannot|can't|refuse|reject|avoid|without)\b/i.test(sentence);
}
