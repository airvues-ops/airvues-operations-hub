"use client";

import { Check } from "lucide-react";
import { PROJECT_STATUS_CHOICES } from "@/lib/quote-types";
import type { DeadlineRisk } from "@/components/pipeline/types";

// Short names for the 7-step client journey (Airtable "Project Status").
// The full name stays in the tooltip and screen-reader text.
const SHORT: Record<(typeof PROJECT_STATUS_CHOICES)[number], string> = {
  "Proposal Created": "Proposal",
  "Proposal Accepted": "Accepted",
  "Proposal Signed": "Signed",
  "Commencement Invoice Paid": "Kickoff paid",
  "First Draft Delivered": "First draft",
  "Project Accepted": "Client approved",
  "Completion Invoice Paid": "Final paid",
};

const OFF_TRACK = new Set(["Cancelled", "Rejected", "Auditing 🚩"]);

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export type OverviewMoney = {
  totalPaid: number;
  amountOwed: number;
  deadlineRisk: DeadlineRisk;
  dealStage: string | null;
};

/**
 * Where the project stands, in one band: the client-journey tracker (click a
 * step to move the project there) and the four numbers people come here for.
 */
export function ProjectOverview({
  journey,
  onSetJourney,
  saving,
  canEdit,
  totalCost,
  money,
  storiesDone,
  storiesTotal,
  hours,
  deliveryDueDate,
}: {
  journey: string | null;
  onSetJourney: (step: string) => void;
  saving: boolean;
  canEdit: boolean;
  totalCost: number;
  money: OverviewMoney;
  storiesDone: number;
  storiesTotal: number;
  hours: number | null;
  deliveryDueDate: string | null;
}) {
  const current = PROJECT_STATUS_CHOICES.indexOf(journey as (typeof PROJECT_STATUS_CHOICES)[number]);
  const offTrack = money.dealStage && OFF_TRACK.has(money.dealStage);
  const finished = current === PROJECT_STATUS_CHOICES.length - 1 || money.dealStage === "Paid";
  const late = money.deadlineRisk === "overdue" && !finished;
  const pct = storiesTotal > 0 ? Math.round((storiesDone / storiesTotal) * 100) : 0;

  // "Owed" is Airtable's Amount Owed formula, shown as-is. It's only computed
  // while the deal is In Progress, and it doesn't always equal value − paid —
  // say so instead of presenting numbers that don't add up.
  const expectedOwed = Math.max(0, totalCost - money.totalPaid);
  const owedNote: React.ReactNode =
    money.dealStage !== "Project In Progress" && money.amountOwed === 0
      ? "Owed is tracked once the project is in progress"
      : Math.abs(money.amountOwed - expectedOwed) > 1
        ? (
            <span className="text-amber">
              Doesn’t match value − paid ({usd(expectedOwed)}). Check the Amount Owed formula in Airtable.
            </span>
          )
        : money.amountOwed > 0
          ? "Value − paid"
          : "Fully paid";

  return (
    <div className="bg-surface border border-rule rounded-lg mb-3">
      {offTrack && (
        <div role="status" className="px-4 py-2 border-b border-rule bg-red-soft text-red text-[12.5px] rounded-t-lg">
          Deal marked <strong className="font-semibold">{money.dealStage?.replace(" 🚩", "")}</strong> — this project
          is off track. Change the deal stage at the top to bring it back.
        </div>
      )}

      {/* Journey tracker */}
      <ol className="grid grid-cols-7 px-2 pt-4 pb-3" aria-label="Client journey">
        {PROJECT_STATUS_CHOICES.map((step, i) => {
          const done = current >= 0 && i < current;
          const isCurrent = i === current;
          const label = SHORT[step];
          const marker = (
            <>
              <span className="relative flex items-center w-full">
                {/* connector to the previous step */}
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-1 ${i === 0 ? "opacity-0" : done || isCurrent ? "bg-emerald/70" : "bg-rule"}`}
                />
                <span
                  className={`grid place-items-center h-6 w-6 rounded-full shrink-0 transition-colors ${
                    done
                      ? "bg-emerald text-bg"
                      : isCurrent
                        ? "bg-surface ring-2 ring-emerald text-emerald"
                        : "bg-surface border border-rule-strong text-ink-faint"
                  }`}
                >
                  {done ? (
                    <Check aria-hidden="true" strokeWidth={3} className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[11px] font-semibold tabnum">{i + 1}</span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-1 ${i === PROJECT_STATUS_CHOICES.length - 1 ? "opacity-0" : done ? "bg-emerald/70" : "bg-rule"}`}
                />
              </span>
              <span
                className={`mt-2 text-center text-[11.5px] leading-tight px-1 ${
                  isCurrent ? "block text-ink-strong font-semibold" : `hidden sm:block text-ink-muted`
                }`}
              >
                {label}
              </span>
            </>
          );
          const a11y = `${step}${isCurrent ? " (current stage)" : done ? " (done)" : ""}`;
          return (
            <li key={step} className="min-w-0" aria-current={isCurrent ? "step" : undefined}>
              {canEdit ? (
                <button
                  type="button"
                  disabled={saving || isCurrent}
                  onClick={() => onSetJourney(step)}
                  title={isCurrent ? step : `Move to “${step}”`}
                  aria-label={a11y}
                  className="group w-full rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 enabled:hover:bg-bg-elevated/70 disabled:cursor-default"
                >
                  {marker}
                </button>
              ) : (
                <div title={step} aria-label={a11y} className="py-1">
                  {marker}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {current < 0 && (
        <p className="px-4 -mt-1 pb-3 text-[12px] text-ink-muted">
          No stage set yet{canEdit ? " — click a step to set where this project is." : "."}
        </p>
      )}

      {/* The numbers */}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border-t border-rule rounded-b-lg overflow-hidden">
        <Stat label="Project value" value={usd(totalCost)} />
        <Stat
          label="Paid / owed"
          value={
            <>
              <span className="text-emerald">{usd(money.totalPaid)}</span>
              <span className="text-ink-faint font-normal"> / </span>
              <span className={money.amountOwed > 0 ? "text-amber" : "text-ink-muted"}>{usd(money.amountOwed)}</span>
            </>
          }
          note={owedNote}
        />
        <Stat
          label="Stories"
          value={
            storiesTotal === 0 ? (
              <span className="text-ink-muted">None yet</span>
            ) : (
              <>
                {storiesDone}
                <span className="text-ink-faint font-normal"> of {storiesTotal} done</span>
              </>
            )
          }
          note={
            storiesTotal > 0 ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-1.5 flex-1 max-w-[120px] rounded-full bg-rule overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Stories completed"
                >
                  <span className="block h-full bg-emerald rounded-full" style={{ width: `${pct}%` }} />
                </span>
                {hours != null && <span className="tabnum">{hours}h scoped</span>}
              </span>
            ) : undefined
          }
        />
        <Stat
          label="Delivery due"
          value={
            deliveryDueDate
              ? new Date(deliveryDueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : <span className="text-ink-muted">Not set</span>
          }
          note={
            !deliveryDueDate ? (
              "Set it in Project details"
            ) : finished ? (
              "Delivered"
            ) : (
              <span className={late ? "text-red font-medium" : money.deadlineRisk === "red" || money.deadlineRisk === "yellow" ? "text-amber" : ""}>
                {dueLabel(deliveryDueDate)}
              </span>
            )
          }
        />
      </dl>
    </div>
  );
}

function dueLabel(dueIso: string): string {
  const days = Math.floor((new Date(dueIso + "T23:59:59").getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} late`;
  if (days === 0) return "Due today";
  return `${days} ${days === 1 ? "day" : "days"} left`;
}

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="bg-surface px-4 py-3 min-w-0">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-[18px] font-semibold text-ink-strong tabnum leading-tight">{value}</dd>
      {note && <dd className="mt-1 text-[12px] text-ink-muted">{note}</dd>}
    </div>
  );
}
