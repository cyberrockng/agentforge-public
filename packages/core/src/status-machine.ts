import { z } from "zod";

export const AgentStatusSchema = z.enum([
  "draft",
  "gated",
  "heartbeat",
  "softlaunch",
  "public",
  "suspended"
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export type TransitionContext = {
  hasHeartbeatPaymentRef?: boolean;
  hasBirthCertificate?: boolean;
  hasNonFounderSoftlaunchCall?: boolean;
};

export type StatusTransitionSubject = {
  status: AgentStatus;
  forge_gate: {
    passed: boolean;
    score: number;
    report_id: string | null;
  };
};

export function assertStatusTransition(
  current: StatusTransitionSubject,
  nextStatus: AgentStatus,
  context: TransitionContext = {}
) {
  if (current.status === nextStatus) {
    return;
  }

  if (current.status === "suspended") {
    throw new Error("Suspended agents cannot transition without an explicit recovery flow");
  }

  if (current.status === "draft" && nextStatus === "gated") {
    if (!current.forge_gate.passed || current.forge_gate.score < 80 || !current.forge_gate.report_id) {
      throw new Error("draft->gated requires passing Forge Gate evidence");
    }
    return;
  }

  if (current.status === "gated" && nextStatus === "heartbeat") {
    if (!context.hasHeartbeatPaymentRef) {
      throw new Error("gated->heartbeat requires a real heartbeat payment_ref");
    }
    return;
  }

  if (current.status === "heartbeat" && nextStatus === "softlaunch") {
    if (!context.hasBirthCertificate) {
      throw new Error("heartbeat->softlaunch requires a birth certificate");
    }
    return;
  }

  if (current.status === "softlaunch" && nextStatus === "public") {
    if (!context.hasNonFounderSoftlaunchCall) {
      throw new Error("softlaunch->public requires a real non-founder softlaunch call");
    }
    return;
  }

  if (nextStatus === "suspended") {
    return;
  }

  throw new Error(`Illegal status transition: ${current.status}->${nextStatus}`);
}
