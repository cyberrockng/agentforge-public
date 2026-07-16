import { runtimeUrl } from "./storefront";

export type FounderCheckoutBody = {
  founderName: string;
  expertiseArea: string;
  targetCustomer: string;
  servicesOffered: string[];
  boundaries: string[];
  tone: string;
  pricingPreference: string;
  brandName?: string;
};

export const agentForgeCheckout = {
  okxAgentId: "#3746",
  providerAgentId: "3746",
  serviceTitle: "AI Agent Business Builder",
  price: "0.40 USDT",
  tokenAmount: "0.40",
  paymentMode: "x402 exact",
  network: "X Layer / eip155:196",
  runtimeEndpoint: runtimeUrl("/svc/forge"),
  preflightEndpoint: runtimeUrl("/svc/forge/preflight"),
  recoveryEndpoint: runtimeUrl("/svc/forge/recovery"),
  requiredFields: [
    "founderName",
    "expertiseArea",
    "targetCustomer",
    "servicesOffered",
    "boundaries",
    "tone",
    "pricingPreference"
  ],
  optionalFields: ["brandName", "referralCode"],
  warnings: [
    "Run preflight first. It validates the exact JSON body before any payment and returns a short-lived af_quote paid endpoint.",
    "Use the quote-bound paid endpoint from preflight for the fresh 402 challenge and payment step. Do not use the bare endpoint for OKX task flows.",
    "If an OKX task client replays an empty body, AgentForge can recover only the exact body tied to that af_quote.",
    "If payment settles but the deliverable response is lost, use recovery with the payment transaction plus the original JSON body.",
    "Some OKX task clients may auto-complete or auto-review after task completion; inspect the deliverable before completion whenever your client allows it.",
    "Leave an honest review only after you can read the deliverable. AgentForge never scripts or requests a positive review.",
    "Do not send seed phrases, private keys, wallet passwords, API keys, or private customer data."
  ]
} as const;

export const exampleFounderCheckoutBody: FounderCheckoutBody = {
  founderName: "Your name or team",
  expertiseArea: "the real skill or service you want to package for OKX.AI buyers",
  targetCustomer: "the exact buyer you want to serve",
  servicesOffered: ["service outcome 1", "service outcome 2"],
  boundaries: ["no fake claims", "no guaranteed OKX approval", "no private keys or secrets"],
  tone: "direct, practical, and evidence-first",
  pricingPreference: "start at 0.40 USDT until 2-3 real paid calls prove value",
  brandName: "Optional brand name"
};

export function bodyJson(body: FounderCheckoutBody = exampleFounderCheckoutBody) {
  return JSON.stringify(body);
}

export function preflightCurl(body: FounderCheckoutBody = exampleFounderCheckoutBody) {
  return [
    "curl -sS -X POST",
    shellQuote(agentForgeCheckout.preflightEndpoint),
    "-H 'content-type: application/json'",
    "--data",
    shellQuote(bodyJson(body))
  ].join(" ");
}

export function task402PayTemplate(body: FounderCheckoutBody = exampleFounderCheckoutBody) {
  return [
    "onchainos agent task-402-pay <JOB_ID>",
    `--provider-agent-id ${agentForgeCheckout.providerAgentId}`,
    "--accepts '<FRESH_ACCEPTS_ARRAY_FROM_THE_402_CHALLENGE>'",
    "--endpoint",
    shellQuote(`${agentForgeCheckout.runtimeEndpoint}?af_quote=<QUOTE_ID_FROM_PREFLIGHT>`),
    "--token-symbol USDT",
    "--token-amount",
    agentForgeCheckout.tokenAmount,
    "--body",
    shellQuote(bodyJson(body))
  ].join(" ");
}

export function recoveryCurl(paymentTransaction = "<PAYMENT_TX_HASH>", body: FounderCheckoutBody = exampleFounderCheckoutBody) {
  return [
    "curl -sS -X POST",
    shellQuote(agentForgeCheckout.recoveryEndpoint),
    "-H 'content-type: application/json'",
    "--data",
    shellQuote(
      JSON.stringify({
        paymentTransaction,
        originalBody: body
      })
    )
  ].join(" ");
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}
