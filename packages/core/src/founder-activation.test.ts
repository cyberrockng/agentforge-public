import { describe, expect, it } from "vitest";
import {
  assertFounderActivationReady,
  evaluateFounderActivation,
  type FounderActivationPacket
} from "./founder-activation.js";

const shieldCheckSpec = {
  id: "agent_shieldcheck_01",
  founder_id: "founder_abiola_apata",
  agent_name: "ShieldCheck",
  slug: "shieldcheck",
  category: "software",
  persona: {
    system_prompt:
      "You are ShieldCheck, a cybersecurity assistant. You help crypto holders identify wallet hygiene risks, token approval risks, phishing patterns, and security best-practice gaps. Never request seed phrases, private keys, or secret credentials.",
    tone: "Professional, calm, reassuring",
    bio: "A security-focused assistant for wallet hygiene, token approvals, phishing review, and security best-practice coaching."
  },
  services: [
    {
      service_id: "wallet_security_checkup",
      title: "Wallet Security Checkup",
      description:
        "Reviews wallet setup habits, device hygiene, connected dApps, and exposure risks without requesting secrets.",
      price_usdt: 3,
      required_inputs: ["Wallet type", "General seed-storage practice", "Connected dApps"],
      output_format: "Prioritized checklist with risk ratings and remediation steps"
    },
    {
      service_id: "phishing_scam_review",
      title: "Phishing & Scam Review",
      description:
        "Reviews a suspicious URL, message, airdrop claim, or transaction prompt for common scam indicators.",
      price_usdt: 2,
      required_inputs: ["Suspicious content", "How it was received", "Whether the user interacted"],
      output_format: "Scam risk assessment with red flags and recommended next steps"
    }
  ],
  boundaries: {
    refusal_policy: [
      "Refuse to request or accept private keys, seed phrases, or secret credentials.",
      "Refuse to guarantee that any wallet, contract, approval, or platform is completely safe.",
      "Refuse financial advice, token recommendations, price predictions, or trading guidance."
    ],
    out_of_scope: [
      "Fund recovery promises",
      "Offensive hacking",
      "Investment advice",
      "Formal legal, tax, or regulatory advice"
    ]
  },
  knowledge: {
    facts: [
      "ShieldCheck is based on a real paid AgentForge First Heartbeat deliverable.",
      "Security reviews use public information and user-provided descriptions only, never secrets."
    ],
    documents: []
  },
  status: "heartbeat",
  forge_gate: {
    passed: true,
    score: 100,
    report_id: "fg_shieldcheck_real_heartbeat"
  },
  created_at: "2026-07-04T00:00:00.000Z"
} satisfies FounderActivationPacket["spec"];

const validPacket = {
  spec: shieldCheckSpec,
  consent: {
    founder_id: "founder_abiola_apata",
    founder_name: "Abiola Apata",
    consented_at: "2026-07-13T00:00:00.000Z",
    evidence_ref: "ops/evidence/2026-07-13-t23-founder-one-activation.md#human-confirmation-required",
    may_publish_agent_page: true,
    may_use_founder_name: true
  },
  heartbeat: {
    payment_ref: "first-heartbeat",
    transaction: "0xb8f8787c7c13de4b6bcdf9139b43da86a02c4e88fa90289539952ca601a7b29b",
    network: "eip155:196",
    amount_usdt: 1,
    evidence_ref: "ops/evidence/2026-07-04-first-heartbeat.md"
  }
} satisfies FounderActivationPacket;

describe("Founder activation", () => {
  it("marks a real heartbeat agent ready only when consent and Forge Gate evidence are present", () => {
    const decision = evaluateFounderActivation(validPacket);

    expect(decision).toEqual({
      ready: true,
      blockers: [],
      agent: {
        id: "agent_shieldcheck_01",
        slug: "shieldcheck",
        name: "ShieldCheck",
        founderId: "founder_abiola_apata",
        status: "heartbeat"
      }
    });
    expect(assertFounderActivationReady(validPacket)).toEqual(validPacket);
  });

  it("blocks public activation without founder consent", () => {
    const decision = evaluateFounderActivation({
      ...validPacket,
      consent: {
        ...validPacket.consent,
        may_publish_agent_page: false
      }
    });

    expect(decision.ready).toBe(false);
    expect(decision.blockers).toContain("Founder has not consented to a public agent page.");
  });

  it("blocks activation when consent is for a different founder", () => {
    const decision = evaluateFounderActivation({
      ...validPacket,
      consent: {
        ...validPacket.consent,
        founder_id: "founder_someone_else"
      }
    });

    expect(decision.ready).toBe(false);
    expect(decision.blockers).toContain("Founder consent does not match the AgentSpec founder_id.");
  });

  it("rejects fake or malformed heartbeat transactions", () => {
    const decision = evaluateFounderActivation({
      ...validPacket,
      heartbeat: {
        ...validPacket.heartbeat,
        transaction: "not-a-tx"
      }
    });

    expect(decision.ready).toBe(false);
    expect(decision.blockers).toContain("heartbeat.transaction: Expected a 32-byte transaction hash");
  });

  it("keeps gated specs out of T2.3 until heartbeat status is applied", () => {
    const decision = evaluateFounderActivation({
      ...validPacket,
      spec: {
        ...validPacket.spec,
        status: "gated"
      }
    });

    expect(decision.ready).toBe(false);
    expect(decision.blockers).toContain(
      "AgentSpec must be in heartbeat status after a real paid heartbeat proof is applied."
    );
  });
});
