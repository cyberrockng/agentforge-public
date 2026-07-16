import Link from "next/link";
import { ArrowRight, ClipboardCheck, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCrossTestingKit } from "@/lib/cross-testing";

export default function CrossTestPage() {
  const kit = getCrossTestingKit();

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">T5.3 Soft-launch cross-testing kit</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">{kit.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {kit.reviewRequirement} Eligible paid calls are shown below, but they are not counted as
            reviews until an actual reviewer writes feedback against the receipt.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                Cross-test workflow
              </div>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 text-sm leading-6 text-[var(--muted-foreground)]">
                {kit.steps.map((step, index) => (
                  <li className="flex gap-3" key={step}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText aria-hidden className="h-4 w-4 text-[var(--accent)]" />
                Review submission fields
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {kit.requiredReviewFields.map((field) => (
                  <div
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
                    key={field}
                  >
                    {field}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-[var(--muted-foreground)]">
                Reviews missing a paid proof-of-service receipt are blocked by code and should not
                be copied into public launch posts, the Guild, or OKX review requests.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Paid-call evidence eligible to back a review</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                    <th className="py-3 pr-4 font-medium">Agent</th>
                    <th className="py-3 pr-4 font-medium">Service</th>
                    <th className="py-3 pr-4 font-medium">Receipt</th>
                    <th className="py-3 pr-4 font-medium">ServiceCall</th>
                    <th className="py-3 pr-4 text-right font-medium">Amount</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kit.eligiblePaidCalls.map((call) => (
                    <tr className="border-b border-[var(--border)] last:border-0" key={call.receiptRecordId}>
                      <td className="py-4 pr-4 font-medium">{call.agentName}</td>
                      <td className="py-4 pr-4 text-[var(--muted-foreground)]">{call.serviceTitle}</td>
                      <td className="py-4 pr-4">
                        <Link
                          className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                          href={call.verifierHref}
                        >
                          {call.receiptRecordId}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs">{call.serviceCallId}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{call.amount}</td>
                      <td className="py-4">
                        <Badge tone={call.reviewEligible ? "success" : "warning"}>
                          {call.reviewEligible ? "Receipt eligible" : "Blocked"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Verified cross-test reviews</h2>
          </CardHeader>
          <CardContent>
            {kit.reviews.length > 0 ? (
              <ul className="grid gap-4">
                {kit.reviews.map((review) => (
                  <li
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                    key={review.reviewId}
                  >
                    <p className="font-medium">{review.reviewerName}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      Asked: {review.askedFor}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      Result: {review.heldUp}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <p className="font-medium">0 verified cross-test reviews recorded.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  This is intentional. AgentForge has paid-call receipts, but no independent
                  cross-test review is counted until review text is submitted with a matching paid
                  receipt and ServiceCall ID.
                </p>
              </div>
            )}

            <Link
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
              href="/launch-engine"
            >
              Prepare X launch drafts
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
