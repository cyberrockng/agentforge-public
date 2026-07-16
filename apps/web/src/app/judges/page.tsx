import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getJudgeBundle, type JudgeBundleLink } from "@/lib/judge-bundle";

export const dynamic = "force-dynamic";

export default async function JudgesPage() {
  const bundle = await getJudgeBundle();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T-J Judge bundle</Badge>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight">{bundle.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            A public, evidence-only route through AgentForge&apos;s M2 proof chain. It links live
            surfaces and on-chain receipts, not internal planning docs or unverifiable claims.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          {bundle.metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {metric.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Listing record</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <Fact label="Agent" value={`AgentForge ${bundle.listing.agentId}`} />
                <Fact label="Service" value={bundle.listing.serviceName} />
                <Fact label="Current service fee" value={bundle.listing.price} />
                <Fact label="Status" value={bundle.listing.status} />
              </dl>
              <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                {bundle.listing.caveat}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {bundle.listing.links.map((link) => (
                  <JudgeLink link={link} key={link.href} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                Evidence route
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                The fastest judge path is: proof log → dashboard → Guild → verifier pages → launch
                draft. Every public link below is either a live AgentForge route or an X Layer
                transaction page.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {bundle.primaryLinks.map((link) => (
                  <JudgeLink link={link} key={link.href + link.label} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Delisting recovery story</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {bundle.story.map((item) => (
                <article
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                  key={`${item.date}-${item.title}`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{item.date}</p>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.body}</p>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Receipt samples</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              {bundle.receiptSamples.map((receipt) => (
                <article
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                  key={receipt.recordId}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {receipt.agentName}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{receipt.title}</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <Fact label="Amount" value={receipt.amount} />
                    <Fact label="Anchor status" value={receipt.anchorStatus} />
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
                    {receipt.caveat}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <JudgeLink
                      link={{
                        label: "Verifier",
                        href: receipt.verifierHref,
                        kind: "internal"
                      }}
                    />
                    <JudgeLink
                      link={{
                        label: "Payment tx",
                        href: receipt.paymentTxHref,
                        kind: "external"
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Founder launch posts</h2>
            </CardHeader>
            <CardContent>
              <Badge tone="warning">{bundle.founderLaunchPosts.status}</Badge>
              <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                {bundle.founderLaunchPosts.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {bundle.founderLaunchPosts.links.map((link) => (
                  <JudgeLink link={link} key={link.label} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Do not claim</h2>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {bundle.doNotClaim.map((claim) => (
                  <li key={claim}>{claim}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Submission handoff</h2>
          </CardHeader>
          <CardContent>
            <Badge tone="warning">{bundle.submissionHandoff.status}</Badge>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="text-sm font-semibold" htmlFor="x-post-draft">
                  X post draft
                </label>
                <textarea
                  className="mt-3 min-h-44 w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4 font-mono text-sm leading-6 text-[var(--foreground)]"
                  defaultValue={bundle.submissionHandoff.xPostDraft}
                  id="x-post-draft"
                />
              </div>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-sm font-semibold">Google form notes</h3>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {bundle.submissionHandoff.googleFormNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Remaining human steps</h3>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {bundle.submissionHandoff.remainingHumanSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Proof log preview</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {bundle.proofLog.slice(-3).map((entry) => (
                <div
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                  key={`${entry.date}-${entry.title}`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{entry.date}</p>
                  <p className="mt-2 font-medium">{entry.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{entry.summary}</p>
                </div>
              ))}
            </div>
            <Link
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
              href="/proof-log"
            >
              Open full proof log
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function JudgeLink({ link }: { link: JudgeBundleLink }) {
  const className =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--surface-raised)]";

  if (link.kind === "external") {
    return (
      <a className={className} href={link.href} rel="noreferrer" target="_blank">
        {link.label}
        <ExternalLink aria-hidden className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}
