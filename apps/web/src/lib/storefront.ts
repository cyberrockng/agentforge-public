import type { TenantCatalogEntry, TenantStatus } from "@/lib/tenant-catalog";

type StatusGateCopy = {
  title: string;
  body: string;
  canCall: boolean;
};

export const runtimeOrigin =
  process.env.NEXT_PUBLIC_AGENTFORGE_RUNTIME_URL ?? "https://agentforge-runtime-production-9a4d.up.railway.app";

export function runtimeUrl(path: string) {
  return `${runtimeOrigin}${path}`;
}

export function statusLabel(status: TenantStatus) {
  switch (status) {
    case "public":
      return "Public";
    case "softlaunch":
      return "Soft-launch";
    case "heartbeat":
      return "Heartbeat";
    case "gated":
      return "Gated";
  }
}

export function statusTone(status: TenantStatus): "neutral" | "success" | "warning" {
  if (status === "public") {
    return "success";
  }

  if (status === "softlaunch" || status === "heartbeat") {
    return "warning";
  }

  return "neutral";
}

export function statusGateCopy(tenant: TenantCatalogEntry): StatusGateCopy {
  switch (tenant.status) {
    case "public":
      return {
        title: "Open for paid requests",
        body: "This service is public and can receive real paid x402 requests through the live runtime endpoint.",
        canCall: true
      };
    case "softlaunch":
      if (tenant.slug === "shieldcheck") {
        return {
          title: "Paid heartbeat complete; controlled soft-launch",
          body:
            "This service passed its live Forge Gate and completed one real paid heartbeat. It remains a controlled soft-launch service, not a guarantee of safety, revenue, OKX approval, or full public launch.",
          canCall: true
        };
      }

      return {
        title: "Controlled soft-launch",
        body:
          "This service is callable for controlled proof runs and customer-paid pilots, but it should not be promoted as a fully public agent until its remaining launch evidence is logged.",
        canCall: true
      };
    case "heartbeat":
      if (tenant.slug === "launch-kit") {
        return {
          title: "Paid heartbeat complete; soft-launch transition pending",
          body:
            "Launch Kit passed its live Forge Gate and completed one self-operated paid heartbeat. Public paid calls stay closed until birth-certificate or equivalent soft-launch transition evidence is recorded.",
          canCall: false
        };
      }

      return {
        title: "Paid heartbeat complete; public launch pending",
        body:
          "This service has a real paid heartbeat, but public calls stay closed until its next evidence step is complete.",
        canCall: false
      };
    case "gated":
      if (tenant.proof?.forgeGenesisTx) {
        return {
          title: "Born from AgentForge proof; own heartbeat pending",
          body:
            "This founder agent was produced by a real paid AgentForge call and has consent to be shown, but its own paid heartbeat has not run yet.",
          canCall: false
        };
      }

      return {
        title: "Not publicly callable yet",
        body: "This service is still behind the launch gate and must pass the proof ladder before public use.",
        canCall: false
      };
  }
}
