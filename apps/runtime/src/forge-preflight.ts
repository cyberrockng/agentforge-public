import type { FounderInterviewInput } from "@agentforge/core";
import type { TenantRuntimeConfig } from "./tenant-registry.js";

export type ForgePreflightResponse = {
  ok: true;
  noPaymentAttempted: true;
  bodyReadyForPayment: true;
  tenant: string;
  agent: {
    id: string;
    okxListing: string;
    name: string;
  };
  service: {
    title: string;
    route: string;
    endpoint: string;
    price: string;
    payment: "x402 exact";
    network: "X Layer / eip155:196";
  };
  requiredFields: string[];
  optionalFields: string[];
  normalizedBody: FounderInterviewInput;
  bodyJson: string;
  quote: {
    id: string;
    paidEndpoint: string;
    expiresAt: string;
    requestBodySha256: string;
    emptyReplayRecovery: string;
  };
  commandTemplates: {
    preflightCurl: string;
    paidEndpointBody: string;
    task402PayTemplate: string;
  };
  nextSteps: string[];
  buyerWarnings: string[];
};

export type ForgePreflightInfo = Omit<
  ForgePreflightResponse,
  "ok" | "bodyReadyForPayment" | "normalizedBody" | "quote"
> & {
  ok: true;
  bodyReadyForPayment: false;
  exampleRequestBody: FounderInterviewInput;
};

const agentForgeOkxAgentId = "3746";
const agentForgeOkxListing = "#3746";
const requiredFields = [
  "founderName",
  "expertiseArea",
  "targetCustomer",
  "servicesOffered",
  "boundaries",
  "tone",
  "pricingPreference"
];
const optionalFields = ["brandName", "referralCode"];

export function buildForgePreflightResponse(args: {
  tenant: TenantRuntimeConfig;
  endpoint: string;
  preflightEndpoint: string;
  input: FounderInterviewInput;
  quote: {
    id: string;
    paidEndpoint: string;
    expiresAt: string;
    requestBodySha256: string;
  };
}): ForgePreflightResponse {
  const normalizedBody = normalizeFounderInput(args.input);
  const bodyJson = JSON.stringify(normalizedBody);
  const common = buildCommonPreflightPayload(args.tenant, args.endpoint, args.preflightEndpoint, bodyJson);

  return {
    ...common,
    ok: true,
    bodyReadyForPayment: true,
    normalizedBody,
    bodyJson,
    quote: {
      ...args.quote,
      emptyReplayRecovery:
        "Use quote.paidEndpoint for the fresh 402 challenge and paid replay. If an OKX task client replays {}, AgentForge can recover this validated body from af_quote before settlement."
    },
    commandTemplates: {
      ...common.commandTemplates,
      paidEndpointBody: bodyJson,
      task402PayTemplate: buildTask402PayTemplate(args.quote.paidEndpoint, args.tenant.displayAmount, bodyJson)
    },
    nextSteps: [
      "Use quote.paidEndpoint, not the bare endpoint, for the fresh 402 challenge and the paid replay.",
      "Copy the normalizedBody or bodyJson exactly into the paid request when your client preserves bodies.",
      "If an OKX task client replays an empty body, the af_quote URL lets AgentForge recover only this preflight-validated body.",
      "Inspect the delivered output before completing or reviewing the OKX task when the client allows it."
    ]
  };
}

export function buildForgePreflightInfo(args: {
  tenant: TenantRuntimeConfig;
  endpoint: string;
  preflightEndpoint: string;
  exampleRequestBody: FounderInterviewInput;
}): ForgePreflightInfo {
  const exampleJson = JSON.stringify(normalizeFounderInput(args.exampleRequestBody));
  const common = buildCommonPreflightPayload(args.tenant, args.endpoint, args.preflightEndpoint, exampleJson);

  return {
    ...common,
    ok: true,
    bodyReadyForPayment: false,
    exampleRequestBody: normalizeFounderInput(args.exampleRequestBody),
    bodyJson: exampleJson
  };
}

function buildCommonPreflightPayload(
  tenant: TenantRuntimeConfig,
  endpoint: string,
  preflightEndpoint: string,
  bodyJson: string
) {
  return {
    noPaymentAttempted: true as const,
    tenant: tenant.slug,
    agent: {
      id: tenant.agentId,
      okxListing: agentForgeOkxListing,
      name: tenant.agentName
    },
    service: {
      title: tenant.service.title,
      route: tenant.route,
      endpoint,
      price: tenant.displayAmount,
      payment: "x402 exact" as const,
      network: "X Layer / eip155:196" as const
    },
    requiredFields,
    optionalFields,
    bodyJson,
    commandTemplates: {
      preflightCurl: buildPreflightCurl(preflightEndpoint, bodyJson),
      paidEndpointBody: bodyJson,
      task402PayTemplate: buildTask402PayTemplate(endpoint, tenant.displayAmount, bodyJson)
    },
    nextSteps: [
      "POST your body to this preflight endpoint first.",
      "Proceed to x402 payment only after preflight returns bodyReadyForPayment: true.",
      "Use the returned quote.paidEndpoint for the fresh 402 challenge and paid call."
    ],
    buyerWarnings: [
      "This endpoint performs no payment and creates no review, receipt, revenue, anchor, or traction proof.",
      "The quote is short-lived and private. It only recovers the exact body AgentForge validated during preflight.",
      "Some OKX task-flow clients can auto-complete or auto-review after a task is completed; inspect the deliverable before completion whenever review control matters.",
      "Do not send seed phrases, private keys, wallet passwords, API secrets, or private customer data."
    ]
  };
}

function normalizeFounderInput(input: FounderInterviewInput): FounderInterviewInput {
  return {
    founderName: input.founderName,
    expertiseArea: input.expertiseArea,
    targetCustomer: input.targetCustomer,
    servicesOffered: [...input.servicesOffered],
    boundaries: [...input.boundaries],
    tone: input.tone,
    pricingPreference: input.pricingPreference,
    ...(input.brandName ? { brandName: input.brandName } : {})
  };
}

function buildPreflightCurl(preflightEndpoint: string, bodyJson: string) {
  return [
    "curl -sS -X POST",
    shellQuote(preflightEndpoint),
    "-H 'content-type: application/json'",
    "--data",
    shellQuote(bodyJson)
  ].join(" ");
}

function buildTask402PayTemplate(endpoint: string, displayAmount: string, bodyJson: string) {
  return [
    "onchainos agent task-402-pay <JOB_ID>",
    `--provider-agent-id ${agentForgeOkxAgentId}`,
    "--accepts '<FRESH_ACCEPTS_ARRAY_FROM_THE_402_CHALLENGE>'",
    "--endpoint",
    shellQuote(endpoint),
    "--token-symbol USDT",
    "--token-amount",
    displayAmount.split(" ")[0] ?? displayAmount,
    "--body",
    shellQuote(bodyJson)
  ].join(" ");
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}
