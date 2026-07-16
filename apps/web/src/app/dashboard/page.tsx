import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatUsdt, getDashboardSummary } from "@/lib/dashboard-ledger";
import { verificationRecords } from "@/lib/verify-records";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const shieldCheckRow = summary.rows.find((row) => row.slug === "shieldcheck");
  const latestReceipt = summary.latestCall
    ? verificationRecords.find(
        (record) =>
          record.recordType === "proof_of_service_receipt" &&
          record.evidence.serviceCallId === summary.latestCall?.id
      )
    : null;

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">Ledger-backed snapshot</Badge>
          <h1 className="mt-3 text-4xl font-semibold">Founder Dashboard</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            These numbers come only from ServiceCall and double-entry ledger journal records. Empty
            rows are intentionally shown as zero until a real paid call creates accounting evidence.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Paid calls" value={summary.paidCalls.toString()} />
          <MetricCard label="Settled" value={formatUsdt(summary.settledAtomic)} />
          <MetricCard label="Forge revenue net" value={formatUsdt(summary.forgeRevenueAtomic)} />
          <MetricCard label="Founder payable" value={formatUsdt(summary.founderPayableAtomic)} />
          <MetricCard label="Referral payable" value={formatUsdt(summary.referralPayableAtomic)} />
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Tenant ledger</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                    <th className="py-3 pr-4 font-medium">Tenant</th>
                    <th className="py-3 pr-4 font-medium">Founder</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 text-right font-medium">Paid calls</th>
                    <th className="py-3 pr-4 text-right font-medium">Settled</th>
                    <th className="py-3 pr-4 text-right font-medium">Forge revenue net</th>
                    <th className="py-3 pr-4 text-right font-medium">Founder payable</th>
                    <th className="py-3 text-right font-medium">Referral payable</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((row) => (
                    <tr className="border-b border-[var(--border)] last:border-0" key={row.slug}>
                      <td className="py-4 pr-4 font-medium">{row.label}</td>
                      <td className="py-4 pr-4 text-[var(--muted-foreground)]">{row.founderLabel}</td>
                      <td className="py-4 pr-4 text-[var(--muted-foreground)]">{row.status}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">{row.paidCalls}</td>
                      <td className="py-4 pr-4 text-right tabular-nums">
                        {formatUsdt(row.settledAtomic)}
                      </td>
                      <td className="py-4 pr-4 text-right tabular-nums">
                        {formatUsdt(row.forgeRevenueAtomic)}
                      </td>
                      <td className="py-4 pr-4 text-right tabular-nums">
                        {formatUsdt(row.founderPayableAtomic)}
                      </td>
                      <td className="py-4 text-right tabular-nums">
                        {formatUsdt(row.referralPayableAtomic)}
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
            <h2 className="text-xl font-semibold">Latest ledger-backed call</h2>
          </CardHeader>
          <CardContent>
            {summary.latestCall ? (
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <Fact label="ServiceCall ID" value={summary.latestCall.id} />
                <Fact label="Ledger transaction" value={summary.latestCall.ledgerTransactionId ?? "none"} />
                <Fact label="Tenant" value={summary.latestCall.tenantSlug} />
                <Fact label="Service" value={summary.latestCall.serviceId} />
                <Fact label="Amount" value={formatUsdt(summary.latestCall.amountAtomic)} />
                <Fact label="Delivered" value={summary.latestCall.deliveredAt ?? "not delivered"} />
                <div className="md:col-span-2">
                  <Fact
                    label="Payment transaction"
                    value={summary.latestCall.paymentTransaction ?? "none"}
                  />
                </div>
                {latestReceipt ? (
                  <div className="md:col-span-2">
                    <dt className="text-[var(--muted)]">Proof-of-service receipt</dt>
                    <dd className="mt-1">
                      <Link
                        className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                        href={`/verify/${latestReceipt.recordId}`}
                      >
                        {latestReceipt.recordId}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                No paid service calls are recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          Source: {summary.source}, generated {summary.generatedAt}. ShieldCheck paid calls:{" "}
          {shieldCheckRow?.paidCalls ?? 0}; its status remains tied to real ledger evidence.
        </p>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-all font-mono text-xs">{value}</dd>
    </div>
  );
}
