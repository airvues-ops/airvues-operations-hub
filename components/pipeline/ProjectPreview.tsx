"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { PipelineQuote } from "@/lib/pipeline";
import { PROJECT_STATUS_CHOICES } from "@/lib/quote-types";
import { DealStageChip } from "./DealStageChip";
import { daysSince, daysUntil, rowFlag, usd } from "./project-list";

const JOURNEY_SHORT = [
  "Proposal",
  "Accepted",
  "Signed",
  "Kickoff paid",
  "First draft",
  "Client approved",
  "Final paid",
];

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

function ago(iso: string | null): string | null {
  if (!iso) return null;
  const d = daysSince(iso);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

/**
 * The selected project, enough to confirm it's the right one and see where it
 * stands before opening it. Stage is editable here because "move this deal
 * along" is the one change people make straight from the list.
 */
export function ProjectPreview({
  quote,
  canEdit,
  onStageChange,
}: {
  quote: PipelineQuote | null;
  canEdit: boolean;
  onStageChange: (id: string, status: string) => void;
}) {
  if (!quote) {
    return (
      <div className="h-full grid place-items-center px-6 py-16 text-center text-[13px] text-ink-muted">
        Select a project to preview it.
      </div>
    );
  }

  const step = (PROJECT_STATUS_CHOICES as readonly string[]).indexOf(quote.projectStatus ?? "");
  const flag = rowFlag(quote);
  const href = `/pipeline/${quote.id}`;
  const due = quote.deliveryDueDate;

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-rule">
        <h2 className="text-[18px] font-semibold text-ink-strong leading-snug">{quote.projectName}</h2>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-muted">
          <span>{quote.client}</span>
          {quote.companyId && quote.company && (
            <Link href={`/clients/${quote.companyId}`} className="text-ink hover:text-emerald hover:underline underline-offset-4">
              {quote.company}
            </Link>
          )}
          {quote.autonumber && <span className="tabnum">#{quote.autonumber}</span>}
          {quote.proposalType && <span>{quote.proposalType.replace(" Proposal", "")}</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DealStageChip
            key={quote.id}
            quoteId={quote.id}
            initialStatus={quote.status}
            canEdit={canEdit}
            onChange={(s) => onStageChange(quote.id, s)}
          />
        </div>
      </div>

      {/* Client journey */}
      <div className="px-5 py-4 border-b border-rule">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-ink-muted">Client journey</span>
          <span className="text-ink-strong font-medium">
            {step >= 0 ? `${step + 1} of 7 · ${JOURNEY_SHORT[step]}` : "Not set"}
          </span>
        </div>
        <ol className="mt-2.5 flex items-center gap-1" aria-label="Client journey">
          {JOURNEY_SHORT.map((label, i) => (
            <li
              key={label}
              title={PROJECT_STATUS_CHOICES[i]}
              className={`h-1.5 flex-1 rounded-full ${
                i < step ? "bg-emerald/70" : i === step ? "bg-emerald" : "bg-rule"
              }`}
            >
              <span className="sr-only">
                {PROJECT_STATUS_CHOICES[i]}
                {i < step ? " (done)" : i === step ? " (current)" : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Numbers */}
      <dl className="grid grid-cols-2 gap-px bg-rule border-b border-rule">
        <Fact label="Project value" value={usd(quote.totalCost)} />
        <Fact
          label="Paid"
          value={<span className={quote.totalPaid > 0 ? "text-emerald" : undefined}>{usd(quote.totalPaid)}</span>}
        />
        <Fact
          label="Owed"
          value={<span className={quote.amountOwed > 0 ? "text-amber" : undefined}>{usd(quote.amountOwed)}</span>}
        />
        <Fact
          label="Not invoiced yet"
          value={<span className={quote.uninvoiced > 0 ? "text-amber" : undefined}>{usd(quote.uninvoiced)}</span>}
        />
        <Fact
          label="Delivery due"
          value={fmtDate(due) ?? <span className="text-ink-muted">Not set</span>}
          note={
            due && flag?.tone === "red" ? (
              <span className="text-red font-medium">{flag.text}</span>
            ) : due && !["Paid", "Cancelled", "Rejected"].includes(quote.status ?? "") ? (
              `${Math.max(0, daysUntil(due))} days left`
            ) : undefined
          }
        />
        <Fact
          label="Stories"
          value={quote.storiesCount}
          note={quote.totalHours != null ? `${quote.totalHours}h scoped` : undefined}
        />
      </dl>

      <ul className="px-5 py-4 space-y-1.5 text-[12.5px] text-ink-muted border-b border-rule">
        <li>
          Prepared {fmtDate(quote.preparedDate) ?? "—"}
          {quote.preparedBy && quote.preparedBy !== "—" && <> by <span className="text-ink">{quote.preparedBy}</span></>}
        </li>
        {quote.quoteLastAccess && (
          <li>
            Client last opened the quote <span className="text-ink">{ago(quote.quoteLastAccess)}</span>
          </li>
        )}
        {quote.signedDate && <li>Signed {fmtDate(quote.signedDate)}</li>}
        {flag && flag.tone === "amber" && <li className="text-amber">{flagSentence(flag.text)}</li>}
      </ul>

      <div className="px-5 py-4 flex flex-wrap items-center gap-2">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold bg-emerald text-bg rounded-md hover:bg-emerald/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Open project
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <a
          href={quote.webQuoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] text-ink border border-rule rounded-md hover:border-rule-strong hover:text-ink-strong"
        >
          Web quote
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
        <a
          href={quote.airtableUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] text-ink border border-rule rounded-md hover:border-rule-strong hover:text-ink-strong"
        >
          Airtable
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
      <p className="hidden lg:block px-5 pb-5 -mt-1 text-[12px] text-ink-muted">
        <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move through the list, <Kbd>Enter</Kbd> to open
      </p>
    </div>
  );
}

function flagSentence(text: string): string {
  if (text.startsWith("Waiting")) return `Sent ${text.replace("Waiting ", "")} ago with no answer yet`;
  if (text.startsWith("Draft")) return `Still a draft after ${text.replace("Draft ", "")}`;
  return text;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block min-w-[1.5em] px-1 py-px rounded border border-rule-strong bg-bg-elevated text-center text-[11px] text-ink font-sans">
      {children}
    </kbd>
  );
}

function Fact({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="bg-surface px-5 py-3 min-w-0">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[18px] font-semibold text-ink-strong tabnum">{value}</dd>
      {note && <dd className="text-[12px] text-ink-muted">{note}</dd>}
    </div>
  );
}
