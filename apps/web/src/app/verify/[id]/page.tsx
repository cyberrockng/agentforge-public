import { notFound } from "next/navigation";
import { findVerificationRecord, xLayerAddressUrl, xLayerTxUrl } from "@/lib/verify-records";

type VerifyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;
  const record = findVerificationRecord(id);

  if (!record) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            {record.recordType === "birth_certificate"
              ? "Verified birth certificate"
              : "Verified proof-of-service receipt"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{record.title}</h1>
          <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-sm text-[var(--muted-foreground)]">
            {record.caveat}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-lg font-semibold">Subject</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">Agent</dt>
                  <dd>{record.agentName}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Agent ID</dt>
                  <dd className="break-all font-mono text-xs">{record.agentId}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Founder</dt>
                  <dd>{record.founderName}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Status at issue</dt>
                  <dd>{record.statusAtIssue}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-lg font-semibold">Evidence</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">Source call</dt>
                  <dd>
                    {record.evidence.servicePath} · {record.evidence.amount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Paid tx</dt>
                  <dd>
                    <a
                      className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                      href={xLayerTxUrl(record.evidence.paymentTx)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {record.evidence.paymentTx}
                    </a>
                  </dd>
                </div>
                {record.evidence.payer ? (
                  <div>
                    <dt className="text-[var(--muted)]">Payer</dt>
                    <dd className="break-all font-mono text-xs">{record.evidence.payer}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[var(--muted)]">Ledger refs</dt>
                  <dd className="break-all font-mono text-xs">
                    {record.evidence.serviceCallId} · {record.evidence.ledgerTransactionId}
                  </dd>
                </div>
              </dl>
            </section>

            {record.anchor ? (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2">
              <h2 className="text-lg font-semibold">X Layer anchor</h2>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[var(--muted)]">Record ID</dt>
                  <dd className="break-all font-mono text-xs">{record.recordId}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Anchored at</dt>
                  <dd>{record.anchor.anchoredAtUtc}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Contract</dt>
                  <dd>
                    <a
                      className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                      href={xLayerAddressUrl(record.anchor.contractAddress)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {record.anchor.contractAddress}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Anchor tx</dt>
                  <dd>
                    <a
                      className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                      href={xLayerTxUrl(record.anchor.anchorTx)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {record.anchor.anchorTx}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Anchor ID</dt>
                  <dd className="break-all font-mono text-xs">{record.anchor.anchorId}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Block</dt>
                  <dd>{record.anchor.blockNumber}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Subject hash</dt>
                  <dd className="break-all font-mono text-xs">{record.anchor.subjectHash}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Evidence hash</dt>
                  <dd className="break-all font-mono text-xs">{record.anchor.evidenceHash}</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Metadata hash</dt>
                  <dd className="break-all font-mono text-xs">{record.anchor.metadataHash}</dd>
                </div>
              </dl>
            </section>
            ) : null}
            {record.pendingAnchor ? (
              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2">
                <h2 className="text-lg font-semibold">Anchor pending</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {record.pendingAnchor.note}
                </p>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--muted)]">Prepared anchor ID</dt>
                    <dd className="break-all font-mono text-xs">{record.pendingAnchor.anchorId}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Target contract</dt>
                    <dd>
                      <a
                        className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                        href={xLayerAddressUrl(record.pendingAnchor.contractAddress)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {record.pendingAnchor.contractAddress}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Subject hash</dt>
                    <dd className="break-all font-mono text-xs">{record.pendingAnchor.subjectHash}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Evidence hash</dt>
                    <dd className="break-all font-mono text-xs">{record.pendingAnchor.evidenceHash}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Metadata hash</dt>
                    <dd className="break-all font-mono text-xs">{record.pendingAnchor.metadataHash}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
            {record.supersededAnchors?.length ? (
              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 md:col-span-2">
                <h2 className="text-lg font-semibold">Disclosed superseded anchors</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  These on-chain writes exist, but they are not the record of truth for this verifier page.
                </p>
                <div className="mt-4 grid gap-4">
                  {record.supersededAnchors.map((anchor) => (
                    <div
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                      key={anchor.anchorId}
                    >
                      <p className="text-sm text-[var(--muted-foreground)]">{anchor.reason}</p>
                      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <dt className="text-[var(--muted)]">Superseded anchor ID</dt>
                          <dd className="break-all font-mono text-xs">{anchor.anchorId}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--muted)]">Superseded anchor tx</dt>
                          <dd>
                            <a
                              className="break-all font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                              href={xLayerTxUrl(anchor.anchorTx)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {anchor.anchorTx}
                            </a>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </>
      </section>
    </main>
  );
}
