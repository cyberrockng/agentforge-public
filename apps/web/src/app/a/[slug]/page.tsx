import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { findStorefrontTenant, listStorefrontTenants } from "@/lib/tenant-catalog";
import { runtimeUrl, statusGateCopy, statusLabel, statusTone } from "@/lib/storefront";

type AgentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listStorefrontTenants().map((tenant) => ({ slug: tenant.slug }));
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const tenant = findStorefrontTenant(slug);

  if (!tenant) {
    notFound();
  }

  const gate = statusGateCopy(tenant);
  const serviceUrl = runtimeUrl(tenant.route);
  const manifestUrl = runtimeUrl(tenant.mcpRoute);

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/forge"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to storefront
        </Link>

        <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={statusTone(tenant.status)}>{statusLabel(tenant.status)}</Badge>
              <h1 className="mt-4 text-4xl font-semibold">{tenant.agentName}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                {tenant.persona.summary}
              </p>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Price</p>
              <p className="mt-1 text-xl font-semibold">{tenant.displayAmount}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">{tenant.service.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {tenant.service.description}
                </p>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold">Buyer inputs</h3>
                  <ul className="mt-3 grid gap-2">
                    {tenant.service.requiredInputs.map((input) => (
                      <li
                        className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
                        key={input}
                      >
                        {input}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold">Output</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {tenant.service.outputFormat}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Safety boundaries</h2>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {tenant.refusalBoundaries.map((boundary) => (
                    <li className="text-sm leading-6 text-[var(--muted-foreground)]" key={boundary}>
                      {boundary}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Status gate</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{gate.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {gate.body}
                </p>

                {gate.canCall ? (
                  <div className="mt-5 flex flex-col gap-3">
                    {tenant.slug === "forge" ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
                        href="/hire"
                      >
                        Hire with preflight
                      </Link>
                    ) : null}
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-center text-sm font-medium hover:bg-[var(--surface-raised)]"
                      href={serviceUrl}
                    >
                      View live service endpoint
                      <ExternalLink aria-hidden className="h-4 w-4" />
                    </a>
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-center text-sm font-medium hover:bg-[var(--surface-raised)]"
                      href={manifestUrl}
                    >
                      View MCP manifest
                      <ExternalLink aria-hidden className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm text-[var(--muted-foreground)]">
                    No public call link is exposed until this service clears its proof gate.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Runtime facts</h2>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Agent ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs">{tenant.agentId}</dd>
                  </div>
                  {tenant.founderName ? (
                    <div>
                      <dt className="text-[var(--muted)]">Founder</dt>
                      <dd className="mt-1 text-sm">{tenant.founderName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[var(--muted)]">Service route</dt>
                    <dd className="mt-1 break-all font-mono text-xs">{tenant.route}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">MCP route</dt>
                    <dd className="mt-1 break-all font-mono text-xs">{tenant.mcpRoute}</dd>
                  </div>
                  {tenant.proof?.forgeGenesisTx ? (
                    <div>
                      <dt className="text-[var(--muted)]">AgentForge genesis tx</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{tenant.proof.forgeGenesisTx}</dd>
                    </div>
                  ) : null}
                  {tenant.proof?.birthCertificateId ? (
                    <div>
                      <dt className="text-[var(--muted)]">Birth certificate</dt>
                      <dd className="mt-1">
                        <a
                          className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                          href={`/verify/${tenant.proof.birthCertificateId}`}
                        >
                          {tenant.proof.birthCertificateId}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
