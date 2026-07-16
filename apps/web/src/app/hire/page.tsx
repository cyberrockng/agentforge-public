import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  agentForgeCheckout,
  bodyJson,
  exampleFounderCheckoutBody,
  preflightCurl,
  recoveryCurl,
  task402PayTemplate
} from "@/lib/agentforge-checkout";

export default function HirePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-[var(--line)] pb-6">
          <Badge tone="success">Buyer checkout</Badge>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">
            Hire AgentForge safely: validate the body before payment.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            AgentForge {agentForgeCheckout.okxAgentId} sells the {agentForgeCheckout.serviceTitle} service for{" "}
            {agentForgeCheckout.price}. This page exists to prevent paid-empty-body mistakes:
            run preflight first, then use the returned quote-bound endpoint through the paid x402 call.
            If the paid response is lost after settlement, recovery requires the payment
            transaction plus that same JSON body.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-strong)]"
              href={agentForgeCheckout.preflightEndpoint}
            >
              Open preflight endpoint
              <ArrowRight aria-hidden className="h-4 w-4" />
            </a>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
              href="/forge"
            >
              Back to storefront
            </Link>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--surface-raised)]"
              href={agentForgeCheckout.recoveryEndpoint}
            >
              Open recovery endpoint
            </a>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Step 1</p>
              <h2 className="mt-2 text-xl font-semibold">Prepare the buyer body</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                These fields are required before payment. AgentForge uses them to produce a
                buyer-specific service package, not a generic launch note.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
                {agentForgeCheckout.requiredFields.map((field) => (
                  <li key={field}>- {field}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Step 2</p>
              <h2 className="mt-2 text-xl font-semibold">Run free preflight</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Preflight validates the exact body and returns{" "}
                <span className="font-mono">bodyReadyForPayment: true</span> plus a short-lived{" "}
                <span className="font-mono">af_quote</span> paid endpoint. It does not charge,
                review, settle, anchor, or create proof.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Step 3</p>
              <h2 className="mt-2 text-xl font-semibold">Pay with the same body</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                Use the quote-bound endpoint for the fresh 402 challenge and keep the same JSON in
                the paid call. If an OKX task client drops the body, AgentForge can recover only the
                preflight-validated body behind that quote.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Recovery</p>
              <h2 className="mt-2 text-xl font-semibold">Recover lost delivery</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                If payment settled but the response did not reach your client, post the payment
                transaction and original body to the recovery endpoint. If AgentForge never saw
                the replay, request make-good delivery or agree-refund before completing.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" />
              Example request body
            </div>
          </CardHeader>
          <CardContent>
            <CodeBlock value={JSON.stringify(exampleFounderCheckoutBody, null, 2)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Copy-paste command templates</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold">1. Preflight, no payment</p>
              <CodeBlock value={preflightCurl()} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">2. Body JSON to keep through payment</p>
              <CodeBlock value={bodyJson()} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">3. Manual x402 task payment fallback</p>
              <CodeBlock value={task402PayTemplate()} />
              <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
                Replace <span className="font-mono">&lt;JOB_ID&gt;</span> and{" "}
                <span className="font-mono">&lt;FRESH_ACCEPTS_ARRAY_FROM_THE_402_CHALLENGE&gt;</span>
                with values from the current OKX task/challenge, and replace{" "}
                <span className="font-mono">&lt;QUOTE_ID_FROM_PREFLIGHT&gt;</span> with the quote id
                returned by preflight.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">4. Recover a lost paid response</p>
              <CodeBlock value={recoveryCurl()} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert aria-hidden className="h-4 w-4 text-[var(--accent)]" />
              Buyer safety notes
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
              {agentForgeCheckout.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-5 text-[var(--muted-foreground)]">
              This page is not proof of traction. Real receipts, reviews, revenue, and anchors are
              shown only after the corresponding live evidence exists.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-black/30 p-4 text-xs leading-5 text-[var(--foreground)]">
      <code>{value}</code>
    </pre>
  );
}
