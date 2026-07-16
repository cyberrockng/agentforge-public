import type { RouteConfig, RoutesConfig } from "@okxweb3/x402-core/http";
import { findTenantCatalogEntry, listTenantCatalog, type TenantCatalogEntry } from "@agentforge/core";

export type TenantRuntimeConfig = TenantCatalogEntry;

export type TenantMeter = {
  quoted: number;
  paid: number;
  delivered: number;
  lastDeliveredAt: string | null;
};

const tenants = listTenantCatalog();
const meters = new Map(tenants.map((tenant) => [tenant.slug, freshMeter()]));

export function listTenants() {
  return listTenantCatalog();
}

export function findTenant(slug: string) {
  return findTenantCatalogEntry(slug);
}

export function getTenantMeter(slug: string): TenantMeter | null {
  const meter = meters.get(slug);
  return meter ? { ...meter } : null;
}

export function recordTenantQuote(slug: string) {
  updateMeter(slug, (meter) => {
    meter.quoted += 1;
  });
}

export function recordTenantPayment(slug: string) {
  updateMeter(slug, (meter) => {
    meter.paid += 1;
  });
}

export function recordTenantDelivery(slug: string, deliveredAt = new Date().toISOString()) {
  updateMeter(slug, (meter) => {
    meter.delivered += 1;
    meter.lastDeliveredAt = deliveredAt;
  });
}

export function isTenantCallable(tenant: TenantRuntimeConfig) {
  return tenant.status === "public" || tenant.status === "softlaunch";
}

export function buildTenantPaymentRoutes(payTo: string): RoutesConfig {
  return Object.fromEntries(
    tenants.filter(isTenantCallable).flatMap((tenant) => {
      const routeConfig: RouteConfig = {
        accepts: {
          scheme: "exact",
          network: "eip155:196",
          payTo,
          price: tenant.priceUsd,
          maxTimeoutSeconds: 300,
          extra: {
            serviceId: tenant.service.serviceId,
            tenantSlug: tenant.slug,
            displayAmount: tenant.displayAmount
          }
        },
        description: tenant.service.title,
        mimeType: "application/json",
        settlementFailedResponseBody: (_context, settleResult) => ({
          contentType: "application/json",
          body: {
            error: "payment_settlement_failed",
            reason: settleResult.errorReason,
            message: settleResult.errorMessage ?? "Payment could not be settled"
          }
        })
      };

      return [
        [`POST ${tenant.route}`, routeConfig],
        [`GET ${tenant.route}`, routeConfig]
      ];
    })
  );
}

function updateMeter(slug: string, apply: (meter: TenantMeter) => void) {
  const meter = meters.get(slug);

  if (!meter) {
    throw new Error(`Unknown tenant: ${slug}`);
  }

  apply(meter);
}

function freshMeter(): TenantMeter {
  return {
    quoted: 0,
    paid: 0,
    delivered: 0,
    lastDeliveredAt: null
  };
}
