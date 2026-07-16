import Link from "next/link";
import { ArrowRight, Megaphone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getLaunchEngine, type LaunchDraft } from "@/lib/launch-engine";

export default function LaunchEnginePage() {
  const engine = getLaunchEngine();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T5.4 X Launch Engine</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
            Founder-editable X launch drafts from real evidence only.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            These drafts are prepared for human editing and manual posting. AgentForge does not
            publish to X from this page, and the copy must stay tied to real receipts, verifier
            records, and current launch status.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                Publishing rules
              </div>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {engine.globalRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <p className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm text-[var(--muted-foreground)]">
                Verified cross-test reviews recorded: {engine.reviewCount}. Do not add review
                claims until `/cross-test` has a real review entry backed by a paid receipt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Megaphone aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                Human-only handoff
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                H6/T7.3 remains human-owned. Use this page to edit wording and choose proof links,
                then the founder/operator posts manually from their own X account.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
                  href="/cross-test"
                >
                  Check review gate
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
                  href="/guild"
                >
                  Open Guild proof
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
                  href="/judges"
                >
                  Judge bundle
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          {engine.drafts.map((draft) => (
            <LaunchDraftCard draft={draft} key={draft.slug} />
          ))}
        </div>
      </section>
    </main>
  );
}

function LaunchDraftCard({ draft }: { draft: LaunchDraft }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {draft.status.replaceAll("_", " ")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{draft.agentName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Founder/operator: {draft.founderName}</p>
          </div>
          <Badge tone={draft.characterCount <= 280 ? "success" : "warning"}>
            {draft.characterCount}/280 chars
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <label className="text-sm font-semibold" htmlFor={`draft-${draft.slug}`}>
          Editable X draft
        </label>
        <textarea
          className="mt-3 min-h-44 w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4 font-mono text-sm leading-6 text-[var(--foreground)]"
          defaultValue={draft.postText}
          id={`draft-${draft.slug}`}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Proof links</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--surface-raised)]"
                href={draft.profileHref}
              >
                Agent page
              </Link>
              {draft.proofLinks.map((link) => (
                <Link
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--surface-raised)]"
                  href={link.href}
                  key={link.recordId}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Do not claim</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {draft.mustNotClaim.map((claim) => (
                <li key={claim}>{claim}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
          <h3 className="text-sm font-semibold">Founder edit checklist</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {draft.editChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
