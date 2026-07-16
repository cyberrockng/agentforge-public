import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getProofLogEntries, type ProofLogEntry, type ProofLogLink } from "@/lib/proof-log";

export default function ProofLogPage() {
  const entries = getProofLogEntries();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">Public proof log</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
            Dated evidence trail for AgentForge M2.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Outcome-only proof entries: listing status, paid calls, receipt links, anchors,
            launch states, and caveats. This page intentionally excludes internal planning
            documents and implementation mechanics.
          </p>
        </header>

        <div className="grid gap-4">
          {entries.map((entry, index) => (
            <ProofLogCard entry={entry} key={`${entry.date}-${entry.title}-${index}`} />
          ))}
        </div>

        <Card>
          <CardContent>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
              href="/judges"
            >
              Open judge bundle
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function ProofLogCard({ entry }: { entry: ProofLogEntry }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{entry.date}</p>
            <h2 className="mt-2 text-2xl font-semibold">{entry.title}</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{entry.summary}</p>
        <ul className="mt-4 grid gap-2 text-sm leading-6">
          {entry.metrics.map((metric) => (
            <li className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2" key={metric}>
              {metric}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.links.map((link) => (
            <ProofLogLinkButton link={link} key={`${entry.title}-${link.href}-${link.label}`} />
          ))}
        </div>
        {entry.caveat ? (
          <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
            {entry.caveat}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProofLogLinkButton({ link }: { link: ProofLogLink }) {
  const className =
    "inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--surface-raised)]";

  if (link.kind === "external") {
    return (
      <a className={className} href={link.href} rel="noreferrer" target="_blank">
        {link.label}
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}

