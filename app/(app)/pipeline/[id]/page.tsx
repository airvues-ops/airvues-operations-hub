// Full-page quote/project detail view. Replaces the side-drawer drill-in from
// /pipeline and /me and /clients/[id]. Re-uses QuoteSheetEditor for the editable
// body, wrapped in a page-shell instead of a portal/overlay.

import Link from "next/link";
import { notFound } from "next/navigation";
import { listAllQuotes } from "@/lib/pipeline";
import { listPeopleOptions } from "@/lib/quotes";
import { listSprintOptions } from "@/lib/sprints";
import { listProjectLogForProject } from "@/lib/project-log";
import { listAllInvoices } from "@/lib/money";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StageSection } from "@/components/projects/StageSection";
import { ArchiveQuoteControl } from "@/components/pipeline/ArchiveQuoteControl";
import { QuoteSheetEditor } from "@/components/pipeline/QuoteSheetEditor";
import { QuoteInvoices } from "@/components/pipeline/QuoteInvoices";
import { DealStageChip } from "@/components/pipeline/DealStageChip";
import { ProjectLogTimeline } from "@/components/projects/ProjectLogTimeline";
import { assertCanAccess } from "@/lib/page-guard";
import { canMutate } from "@/lib/authz";
import { PROJECT_STATUS_CHOICES } from "@/lib/quote-types";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

type Params = {
  params: { id: string };
  searchParams?: { fromClient?: string };
};

export default async function QuoteDetailPage({ params, searchParams }: Params) {
  await assertCanAccess("/pipeline");
  const [quotes, people, sprints, canEdit, logEntries, allInvoices] = await Promise.all([
    listAllQuotes(),
    listPeopleOptions(),
    listSprintOptions(),
    canMutate(),
    listProjectLogForProject(params.id),
    listAllInvoices(),
  ]);

  const quote = quotes.find((q) => q.id === params.id);
  if (!quote) notFound();

  const days = daysSince(quote.preparedDate);
  const stale =
    days != null &&
    days > 14 &&
    (quote.status === "Sent. Awaiting Approval." || quote.status === "Draft");

  const fromClient = searchParams?.fromClient ?? null;
  // Invoices are live from signing (kickoff invoice) until the final one is paid.
  const journeyIdx = (PROJECT_STATUS_CHOICES as readonly string[]).indexOf(quote.projectStatus ?? "");

  const projectInvoices = allInvoices
    .filter((inv) => inv.quoteRecordIds.includes(quote.id))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <Link
        href={fromClient ? `/clients/${fromClient}?highlight=${quote.id}` : "/pipeline"}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink-strong rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {fromClient ? "Back to account" : "Projects"}
      </Link>

      <header className="mt-3 mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold text-ink-strong leading-tight tracking-[-0.01em]">
            {quote.projectName}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <span>{quote.client}</span>
            {quote.companyId && quote.company && (
              <Link href={`/clients/${quote.companyId}`} className="text-ink hover:text-emerald underline-offset-4 hover:underline">
                {quote.company}
              </Link>
            )}
            {quote.autonumber && <span className="tabnum">Quote #{quote.autonumber}</span>}
            {quote.preparedDate && <span>Prepared {fmtDate(quote.preparedDate)}</span>}
            {stale && (
              <span className="px-2 py-0.5 rounded bg-red-soft text-red text-[12px] font-medium">
                No reply in {days} days
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DealStageChip quoteId={quote.id} initialStatus={quote.status} canEdit={canEdit} />
          <a
            href={quote.webQuoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium bg-emerald text-bg rounded-md hover:bg-emerald/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Open web quote
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
          <a
            href={quote.airtableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] text-ink border border-rule rounded-md hover:border-rule-strong hover:text-ink-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
          >
            Airtable
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
          <ArchiveQuoteControl
            quoteId={quote.id}
            projectName={quote.projectName}
            label="Archive"
            redirectTo="/pipeline"
          />
        </div>
      </header>

      <QuoteSheetEditor
        quoteId={quote.id}
        people={people}
        sprints={sprints}
        canEdit={canEdit}
        overview={{
          totalPaid: quote.totalPaid,
          amountOwed: quote.amountOwed,
          deadlineRisk: quote.deadlineRisk,
          dealStage: quote.status,
        }}
        afterScope={
          <>
            <QuoteInvoices
              quoteId={quote.id}
              invoices={projectInvoices}
              canEdit={canEdit}
              state={journeyIdx >= 6 ? "done" : journeyIdx >= 2 ? "current" : "upcoming"}
            />
            <StageSection
              id="activity"
              title="Activity"
              summary={logEntries.length === 0 ? "Nothing logged yet" : `${logEntries.length} ${logEntries.length === 1 ? "event" : "events"}`}
              defaultOpen={false}
              storageKey={`pj:${quote.id}:activity`}
            >
              <div className="p-4">
                <ProjectLogTimeline entries={logEntries} />
              </div>
            </StageSection>
          </>
        }
      />
    </main>
  );
}
