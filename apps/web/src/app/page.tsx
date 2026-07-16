import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listStorefrontTenants } from "@/lib/tenant-catalog";
import { statusLabel, statusTone } from "@/lib/storefront";

const routes = [
  ["/judges", "Judges"],
  ["/proof-log", "Proof Log"],
  ["/forge", "Storefront"],
  ["/hire", "Hire"],
  ["/templates", "Templates"],
  ["/cross-test", "Cross-test"],
  ["/launch-engine", "Launch Engine"],
  ["/guild", "Guild"],
  ["/dashboard", "Dashboard"],
  ["/admin", "Admin"]
] as const;

export default function HomePage() {
  const tenants = listStorefrontTenants();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">Live storefront</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
            Turn human expertise into live, verified Agent Service Providers on OKX.AI.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            AgentForge exposes real tenant storefronts from the runtime catalog. Revenue,
            receipts, founders, and anchors appear only after they have live evidence behind them.
          </p>
        </header>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10">
          {routes.map(([href, label]) => (
            <Link
              className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium hover:border-[var(--primary)]"
              href={href}
              key={href}
            >
              {label}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          ))}
        </nav>

        <section className="grid gap-4 md:grid-cols-2">
          {tenants.map((tenant) => (
            <Card key={tenant.slug}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {tenant.category}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">{tenant.agentName}</h2>
                  </div>
                  <Badge tone={statusTone(tenant.status)}>{statusLabel(tenant.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {tenant.service.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
                    href={`/a/${tenant.slug}`}
                  >
                    Open storefront
                  </Link>
                  <span className="text-sm text-[var(--muted)]">{tenant.displayAmount}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" />
              Reality Boundary
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              This shell intentionally shows no sample founders, revenue, receipts,
              reviews, or anchors. Production evidence appears only after the relevant
              payment, receipt, or verification record exists.
            </p>
            <p className="mt-4 text-xs leading-5 text-[var(--muted-foreground)]">
              Official avatar:
              {" "}
              <span className="mono break-all">
                static.okx.com/.../74ffa21c-6cc3-4430-96fe-d3d3c0e5035a.png
              </span>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
