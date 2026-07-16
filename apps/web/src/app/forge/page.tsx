import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listStorefrontTenants } from "@/lib/tenant-catalog";
import { runtimeUrl, statusGateCopy, statusLabel, statusTone } from "@/lib/storefront";

export default function ForgePage() {
  const tenants = listStorefrontTenants();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T2.2 Storefront</Badge>
          <h1 className="mt-3 text-4xl font-semibold">AgentForge storefront</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            These are the currently registered AgentForge runtime tenants. The page shows only
            real catalog data and gates each service by its current launch status.
          </p>
          <Link
            className="mt-5 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
            href="/hire"
          >
            Hire AgentForge safely
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <Link
            className="mt-3 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
            href="/templates"
          >
            View T5.1 templates
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <Link
            className="mt-3 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
            href="/cross-test"
          >
            Open T5.3 cross-test kit
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <Link
            className="mt-3 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
            href="/launch-engine"
          >
            Prepare X launch drafts
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.map((tenant) => {
            const gate = statusGateCopy(tenant);

            return (
              <Card key={tenant.slug}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        {tenant.agentId}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">{tenant.agentName}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{tenant.service.title}</p>
                    </div>
                    <Badge tone={statusTone(tenant.status)}>{statusLabel(tenant.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {tenant.service.description}
                  </p>

                  <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                    <p className="text-sm font-semibold">{gate.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {gate.body}
                    </p>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[var(--muted)]">Price</dt>
                      <dd className="mt-1 font-medium">{tenant.displayAmount}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Runtime route</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{tenant.route}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
                      href={`/a/${tenant.slug}`}
                    >
                      View details
                      <ArrowRight aria-hidden className="h-4 w-4" />
                    </Link>
                    <a
                      className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
                      href={runtimeUrl(tenant.mcpRoute)}
                    >
                      MCP manifest
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
