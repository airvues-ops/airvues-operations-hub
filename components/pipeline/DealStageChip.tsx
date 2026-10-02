"use client";

import { useState, useTransition } from "react";
import { updateQuoteDealStage } from "@/lib/mutations/quote";

const STAGES = [
  "Draft",
  "Sent. Awaiting Approval.",
  "Approved and Signed",
  "Awaiting Payment",
  "Project In Progress",
  "Paid",
  "Cancelled",
  "Rejected",
  "Auditing 🚩",
] as const;

export function DealStageChip({
  quoteId,
  initialStatus,
  canEdit,
}: {
  quoteId: string;
  initialStatus: string | null;
  canEdit: boolean;
}) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleChange(next: string) {
    const prev = status;
    setStatus(next);
    setErr(null);
    startTransition(async () => {
      const res = await updateQuoteDealStage(quoteId, next);
      if ("error" in res) {
        setErr(res.error);
        setStatus(prev);
      }
    });
  }

  if (!canEdit) {
    return (
      <span className="px-3 py-1.5 bg-bg-elevated border border-rule rounded-md text-ink-strong text-[12.5px]">
        <span className="text-ink-faint mr-1.5">Deal stage</span>
        {status ?? "—"}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center bg-bg-elevated border border-rule rounded-md text-[12.5px] focus-within:border-emerald"
      title={err ?? "Sales pipeline stage — internal, not shown to the client"}
    >
      <span className="pl-3 text-ink-faint">Deal stage</span>
      <select
        value={status ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="bg-transparent text-ink-strong font-medium py-1.5 pl-1.5 pr-2 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        {!status && <option value="">—</option>}
        {STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {err && <span role="alert" className="pr-2.5 text-red text-[11px]">Not saved</span>}
    </span>
  );
}
