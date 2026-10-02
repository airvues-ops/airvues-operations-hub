"use client";

import { Check, ChevronDown } from "lucide-react";
import { useLocalStorageBoolean } from "@/lib/use-local-storage";

export type StageState = "done" | "current" | "upcoming";

const STATE_LABEL: Record<StageState, string> = {
  done: "Done",
  current: "Current stage",
  upcoming: "Not started",
};

/**
 * One section of the project page. Sections follow the project lifecycle, so
 * each can carry where it sits in it: done stages fold to their summary line,
 * the current one opens. The summary stays visible when folded so a closed
 * section still answers "what's in here" without opening it.
 */
export function StageSection({
  id,
  title,
  summary,
  state,
  defaultOpen = true,
  storageKey,
  actions,
  children,
}: {
  id?: string;
  title: string;
  /** One line describing the contents — shown beside the title. */
  summary?: React.ReactNode;
  state?: StageState;
  defaultOpen?: boolean;
  /** Persists open/closed per viewer. */
  storageKey: string;
  /** Controls shown in the header when open (e.g. "Add story"). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useLocalStorageBoolean(storageKey, defaultOpen);
  const bodyId = `${storageKey}-body`;

  return (
    <section id={id} className="bg-surface border border-rule rounded-lg mb-3 scroll-mt-16">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-4 pr-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex-1 min-w-[12rem] flex items-center gap-3 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
        >
          {state && <StageMark state={state} />}
          <h2 className="text-[14px] font-semibold text-ink-strong shrink-0">{title}</h2>
          {summary && (
            <span className="text-[12.5px] text-ink-muted truncate min-w-0">{summary}</span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`ml-auto h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
        </button>
        {open && actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {open && (
        <div id={bodyId} className="border-t border-rule">
          {children}
        </div>
      )}
    </section>
  );
}

function StageMark({ state }: { state: StageState }) {
  return (
    <span
      title={STATE_LABEL[state]}
      className={`grid place-items-center h-5 w-5 rounded-full shrink-0 ${
        state === "done"
          ? "bg-emerald/15 text-emerald"
          : state === "current"
            ? "ring-2 ring-emerald/70 ring-offset-2 ring-offset-surface"
            : "border border-rule-strong"
      }`}
    >
      {state === "done" && <Check aria-hidden="true" strokeWidth={2.5} className="h-3 w-3" />}
      {state === "current" && <span className="h-2 w-2 rounded-full bg-emerald" aria-hidden="true" />}
      <span className="sr-only">{STATE_LABEL[state]}</span>
    </span>
  );
}
