import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatUsdt } from "@/lib/dashboard-ledger";
import { getGuildSummary, type GuildEntry } from "@/lib/guild";

export const dynamic = "force-dynamic";

export default async function GuildPage() {
  const summary = await getGuildSummary();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T4.4 Guild</Badge>
          <h1 className="mt-3 text-4xl font-semibold">Founder Guild</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            A public gallery of AgentForge agents with real evidence only. Entries appear here only
            when there is a listed/forged agent record and at least one published verifier receipt
            or certificate.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {summary.entries.map((entry) => (
            <GuildCard entry={entry} key={entry.slug} />
          ))}
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Not counted yet</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              These tenants exist in the runtime catalog, but the Guild does not count them until a
              public receipt or certificate exists.
            </p>
            <ul className="mt-4 grid gap-3">
              {summary.excluded.map((entry) => (
                <li
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                  key={entry.slug}
                >
                  <p className="font-medium">{entry.agentName}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{entry.reason}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function GuildCard({ entry }: { entry: GuildEntry }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {entry.agentId}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{entry.agentName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{entry.operatorLabel}</p>
          </div>
          <Badge tone={entry.statusLabel === "Public" ? "success" : "neutral"}>{entry.statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{entry.summary}</p>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Founder/operator</dt>
            <dd className="mt-1">{entry.founderName}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Service</dt>
            <dd className="mt-1">{entry.serviceTitle}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Price</dt>
            <dd className="mt-1">{entry.displayAmount}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Ledger-backed paid calls</dt>
            <dd className="mt-1">
              {entry.paidCalls} · {formatUsdt(entry.settled)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
          <h3 className="text-sm font-semibold">Published proof</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.evidenceLinks.map((link) => (
              <Link
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-white"
                href={link.href}
                key={link.recordId}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <ul className="mt-5 grid gap-2">
          {entry.caveats.map((caveat) => (
            <li className="text-xs leading-5 text-[var(--muted-foreground)]" key={caveat}>
              {caveat}
            </li>
          ))}
        </ul>

        <Link
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
          href={entry.profileHref}
        >
          View agent page
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
