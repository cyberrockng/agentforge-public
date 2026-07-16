import Link from "next/link";
import { ArrowRight, Boxes, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTemplateGallery } from "@/lib/templates";

export default function TemplatesPage() {
  const templates = getTemplateGallery();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T5.1 Template Forging</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
            Five service templates ready for founder personalization.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            These are executable AgentForge blueprints: each one can generate an AgentSpec draft
            after a real founder provides their name, customer, expertise, service focus, boundaries,
            tone, and pricing preference.
          </p>
          <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Boundary: templates are not public agents, receipts, reviews, external-founder wins,
                or approval claims. A template becomes a real AgentForge service only after founder
                consent, Forge Gate, paid heartbeat, receipt evidence, and the required launch-ladder
                checks.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {template.id}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">{template.title}</h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">{template.sourceLabel}</p>
                  </div>
                  <Badge tone="neutral">{template.displayPrice}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  {template.summary}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold">Best for</h3>
                    <ul className="mt-3 grid gap-2">
                      {template.bestFor.map((item) => (
                        <li
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
                          key={item}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Buyer inputs</h3>
                    <ul className="mt-3 grid gap-2">
                      {template.buyerInputs.map((input) => (
                        <li className="text-sm leading-6 text-[var(--muted-foreground)]" key={input}>
                          {input}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-semibold">Output</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {template.outputFormat}
                  </p>
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-semibold">Personalization required</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.personalizationFields.map((field) => (
                      <span
                        className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                        key={field}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                  <h3 className="text-sm font-semibold">Template boundary</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {template.caveat}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Boxes aria-hidden className="h-4 w-4 text-[var(--accent)]" />
              What this unlocks next
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              T5.1 gives AgentForge reusable starting points. T5.2 adds allowlisted referral
              credits that are deducted from Forge share and balanced in the ledger. T5.3 packages
              these templates into a soft-launch cross-testing kit where reviews require paid-call
              receipts. T5.4 turns the verified evidence into founder-editable X launch drafts.
            </p>
            <Link
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
              href="/cross-test"
            >
              Open cross-testing kit
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              className="ml-3 mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
              href="/launch-engine"
            >
              Open launch engine
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
