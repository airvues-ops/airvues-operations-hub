"use client";

import { useState, useTransition } from "react";
import { updateQuoteDealStage } from "@/lib/mutations/quote";
import { Combobox } from "@/components/ui/Combobox";
import { DEAL_STAGES, stageMeta } from "./project-list";

const OPTIONS = DEAL_STAGES.map((s) => ({ value: s.value, label: s.label, color: s.color }));

/**
 * Deal stage (Airtable Quotes.Status — the internal sales pipeline). Each
 * stage has its own colour. Changes apply immediately and roll back if the
 * save fails.
 */
export function DealStageChip({
  quoteId,
  initialStatus,
  canEdit,
  onChange,
}: {
  quoteId: string;
  initialStatus: string | null;
  canEdit: boolean;
  /** Called on change (and again with the old value if the save fails). */
  onChange?: (status: string) => void;
}) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleChange(next: string) {
    const prev = status;
    setStatus(next);
    setErr(null);
    onChange?.(next);
    startTransition(async () => {
      const res = await updateQuoteDealStage(quoteId, next);
      if ("error" in res) {
        setErr(res.error);
        setStatus(prev);
        if (prev) onChange?.(prev);
      }
    });
  }

  if (!canEdit) {
    const st = stageMeta(status);
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-rule rounded-md text-[12.5px]">
        <span className="text-ink-muted">Deal stage</span>
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
        <span className="text-ink-strong">{st.label}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Combobox
        label="Deal stage"
        prefix="Deal stage"
        value={status}
        options={OPTIONS}
        onChange={handleChange}
        disabled={pending}
        searchable={false}
        className="min-w-[230px]"
      />
      {err && (
        <span role="alert" className="text-[12px] text-red">
          Not saved: {err}
        </span>
      )}
    </div>
  );
}
