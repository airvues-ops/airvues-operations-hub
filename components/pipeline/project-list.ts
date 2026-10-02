// Shared, client-safe logic for the Projects list: stage buckets, labels,
// row flags, filtering and sorting.
import type { PipelineQuote } from "@/lib/pipeline";
import type { Filter, Sort, StageBucket } from "./types";

export const STAGE_STATUSES: Record<StageBucket, string[]> = {
  all: [],
  draft: ["Draft"],
  sent: ["Sent. Awaiting Approval."],
  signed: ["Approved and Signed", "Awaiting Payment", "Project In Progress"],
  paid: ["Paid"],
  lost: ["Cancelled", "Rejected"],
  auditing: ["Auditing 🚩"],
};

export const STAGE_TABS: { key: StageBucket; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Awaiting approval" },
  { key: "signed", label: "Active" },
  { key: "paid", label: "Paid" },
  { key: "auditing", label: "Auditing" },
  { key: "lost", label: "Cancelled / rejected" },
];

/** Airtable Deal Stage → what people call it, plus its colour role. */
const STAGE_META: Record<string, { label: string; tone: string }> = {
  Draft: { label: "Draft", tone: "bg-rule/60 text-ink-muted" },
  "Sent. Awaiting Approval.": { label: "Awaiting approval", tone: "bg-amber-soft text-amber" },
  "Approved and Signed": { label: "Signed", tone: "bg-sky-soft text-sky" },
  "Awaiting Payment": { label: "Awaiting payment", tone: "bg-sky-soft text-sky" },
  "Project In Progress": { label: "In progress", tone: "bg-sky-soft text-sky" },
  Paid: { label: "Paid", tone: "bg-emerald-soft text-emerald" },
  Cancelled: { label: "Cancelled", tone: "bg-red-soft text-red" },
  Rejected: { label: "Rejected", tone: "bg-red-soft text-red" },
  "Auditing 🚩": { label: "Auditing", tone: "bg-amber-soft text-amber" },
};

export function stageMeta(status: string | null): { label: string; tone: string } {
  return (status && STAGE_META[status]) || { label: status ?? "No stage", tone: "bg-rule/60 text-ink-muted" };
}

export function daysSince(iso: string | null): number {
  if (!iso) return -1;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function daysUntil(iso: string): number {
  return Math.floor((new Date(iso + "T23:59:59").getTime() - Date.now()) / 86_400_000);
}

const OPEN_STATUSES = new Set(["Sent. Awaiting Approval.", "Draft", "Auditing 🚩"]);
const DONE_STATUSES = new Set(["Paid", "Cancelled", "Rejected"]);

export function isStalled(q: PipelineQuote): boolean {
  return !!q.status && OPEN_STATUSES.has(q.status) && daysSince(q.preparedDate) > 14;
}

/**
 * The one thing about a row worth flagging, most urgent first: late delivery,
 * delivery due soon, or a proposal sitting with no movement for two weeks.
 */
export function rowFlag(q: PipelineQuote): { text: string; tone: "red" | "amber" } | null {
  const finished = q.status ? DONE_STATUSES.has(q.status) : false;
  if (!finished && q.deliveryDueDate) {
    const d = daysUntil(q.deliveryDueDate);
    if (q.deadlineRisk === "overdue" || d < 0) return { text: `${Math.abs(d)}d late`, tone: "red" };
    if (q.deadlineRisk === "red" || q.deadlineRisk === "yellow")
      return { text: d === 0 ? "Due today" : `Due in ${d}d`, tone: "amber" };
  }
  if (isStalled(q)) {
    const days = daysSince(q.preparedDate);
    return { text: q.status === "Draft" ? `Draft ${days}d` : `Waiting ${days}d`, tone: "amber" };
  }
  return null;
}

export function applyFilter(rows: PipelineQuote[], f: Filter): PipelineQuote[] {
  return rows.filter((r) => {
    const lost = r.status === "Rejected" || r.status === "Cancelled";
    // Lost deals are hidden unless asked for — or unless you're on their tab.
    if (lost && !f.showRejected && f.stage !== "lost") return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${r.projectName} ${r.client} ${r.company ?? ""} ${r.preparedBy} ${r.autonumber ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.stage !== "all") {
      if (!r.status || !STAGE_STATUSES[f.stage].includes(r.status)) return false;
    }
    if (f.proposalType !== "all" && r.proposalType !== f.proposalType) return false;
    if (f.client && r.client !== f.client) return false;
    if (f.preparedBy && r.preparedBy !== f.preparedBy) return false;
    if (f.from && r.preparedDate && r.preparedDate < f.from) return false;
    if (f.to && r.preparedDate && r.preparedDate > f.to) return false;
    if (f.stalledOnly && !isStalled(r)) return false;
    if (f.deadlineRisk !== "all") {
      // A paid or lost project isn't late, whatever its due date says.
      if (r.status && DONE_STATUSES.has(r.status)) return false;
      if (f.deadlineRisk === "needs-attention") {
        if (r.deadlineRisk === "ok") return false;
      } else if (r.deadlineRisk !== f.deadlineRisk) {
        return false;
      }
    }
    return true;
  });
}

export function applySort(rows: PipelineQuote[], s: Sort): PipelineQuote[] {
  const dir = s.dir === "asc" ? 1 : -1;
  const val = (q: PipelineQuote): string | number => {
    switch (s.key) {
      case "preparedDate": return q.preparedDate ?? "";
      case "totalCost": return q.totalCost;
      case "client": return q.client.toLowerCase();
      // Lifecycle order, not alphabetical: draft → awaiting → active → paid…
      case "status": return STAGE_TABS.findIndex((t) => t.key !== "all" && STAGE_STATUSES[t.key].includes(q.status ?? ""));
      case "autonumber": return q.autonumber ?? 0;
      case "daysSinceSent": return daysSince(q.preparedDate);
      case "uninvoiced": return q.uninvoiced;
      case "invoiced": return q.invoiced;
    }
  };
  return [...rows].sort((a, b) => {
    const av = val(a);
    const bv = val(b);
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}

export const SORT_OPTIONS: { label: string; sort: Sort }[] = [
  { label: "Newest first", sort: { key: "preparedDate", dir: "desc" } },
  { label: "Oldest first", sort: { key: "preparedDate", dir: "asc" } },
  { label: "Highest value", sort: { key: "totalCost", dir: "desc" } },
  { label: "Most not invoiced", sort: { key: "uninvoiced", dir: "desc" } },
  { label: "Most invoiced", sort: { key: "invoiced", dir: "desc" } },
  { label: "Deal stage", sort: { key: "status", dir: "asc" } },
  { label: "Client A–Z", sort: { key: "client", dir: "asc" } },
  { label: "Quote # (high to low)", sort: { key: "autonumber", dir: "desc" } },
];

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** $12,400 → "$12.4k" for tight list cells; exact value stays in the preview. */
export const usdShort = (n: number) =>
  n >= 10_000
    ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`
    : usd(n);
