"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LayoutList, Plus, Search, SlidersHorizontal, Table2, X } from "lucide-react";
import type { PipelineQuote } from "@/lib/pipeline";
import { ProjectPreview } from "./ProjectPreview";
import { ProjectTable } from "./ProjectTable";
import { Combobox } from "@/components/ui/Combobox";
import { setMyPreference } from "@/lib/mutations/preferences";
import {
  STAGE_STATUSES,
  STAGE_TABS,
  SORT_OPTIONS,
  applyFilter,
  applySort,
  rowFlag,
  stageMeta,
  stagePillStyle,
  usd,
  usdShort,
} from "./project-list";
import { DEFAULT_SORT, EMPTY_FILTER, type Filter, type GroupBy, type Sort, type StageBucket } from "./types";

const field =
  "px-2.5 py-1.5 text-[12.5px] bg-surface border border-rule text-ink rounded-md focus:border-emerald focus:outline-none transition-colors";

type Props = {
  quotes: PipelineQuote[];
  canEdit: boolean;
  initialFilter?: Partial<Filter>;
  /** The viewer's saved choice (People.Preferences "projects.view"). */
  initialView?: "list" | "table";
};

/**
 * Projects: a two-line list to scan, with the selected project previewed
 * beside it. Click (or ↑ ↓) selects, Enter / double-click / "Open project"
 * opens. Below lg there's no room for the pane, so a tap opens directly.
 */
export function PipelineDashboard({ quotes: initialQuotes, canEdit, initialFilter, initialView = "list" }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>({ ...EMPTY_FILTER, ...(initialFilter ?? {}) });
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "table">(initialView);

  // Remembered per person in Airtable, so it follows them across devices.
  // Fire-and-forget: the switch is instant; a failed save just means the
  // old choice comes back next visit.
  const chooseView = (v: "list" | "table") => {
    if (v === view) return;
    setView(v);
    void setMyPreference("projects.view", v).then((res) => {
      if ("error" in res) console.warn("[projects] view preference not saved:", res.error);
    });
  };
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Stage changes made from the preview apply here without a reload.
  const quotes = useMemo(
    () => initialQuotes.map((q) => (stageOverrides[q.id] ? { ...q, status: stageOverrides[q.id] } : q)),
    [initialQuotes, stageOverrides],
  );

  const clients = useMemo(() => [...new Set(quotes.map((q) => q.client).filter(Boolean))].sort(), [quotes]);
  const preparers = useMemo(
    () => [...new Set(quotes.map((q) => q.preparedBy).filter((p) => p && p !== "—"))].sort(),
    [quotes],
  );

  const groupKey = useMemo(() => {
    if (groupBy === "none") return null;
    return (q: PipelineQuote) => {
      const v = groupBy === "client" ? q.client : q.company;
      return !v || v === "—" ? `No ${groupBy}` : v;
    };
  }, [groupBy]);

  const filtered = useMemo(() => applyFilter(quotes, filter), [quotes, filter]);
  const rows = useMemo(() => {
    const sorted = applySort(filtered, sort);
    // Stable sort: grouping keeps the chosen order inside each group.
    return groupKey ? sorted.sort((a, b) => groupKey(a).localeCompare(groupKey(b))) : sorted;
  }, [filtered, sort, groupKey]);

  // Tab counts reflect every other filter. Lost deals are always counted for
  // their own tab, even while they're hidden from the others.
  const tabCounts = useMemo(() => {
    const base = applyFilter(quotes, { ...filter, stage: "all", showRejected: true });
    const counts = { all: 0, draft: 0, sent: 0, signed: 0, paid: 0, lost: 0, auditing: 0 } as Record<StageBucket, number>;
    for (const r of base) {
      const lost = STAGE_STATUSES.lost.includes(r.status ?? "");
      if (!lost || filter.showRejected) counts.all++;
      for (const t of STAGE_TABS) {
        if (t.key !== "all" && r.status && STAGE_STATUSES[t.key].includes(r.status)) counts[t.key]++;
      }
    }
    return counts;
  }, [quotes, filter]);

  // The headline numbers, over everything — independent of the current view.
  const summary = useMemo(() => {
    const awaiting = quotes.filter((q) => q.status === "Sent. Awaiting Approval.");
    const late = quotes.filter((q) => rowFlag(q)?.tone === "red");
    const notInvoiced = quotes.reduce((s, q) => s + q.uninvoiced, 0);
    const active = quotes.filter((q) => STAGE_STATUSES.signed.includes(q.status ?? ""));
    return {
      activeCount: active.length,
      activeValue: active.reduce((s, q) => s + q.totalCost, 0),
      awaitingCount: awaiting.length,
      awaitingValue: awaiting.reduce((s, q) => s + q.totalCost, 0),
      lateCount: late.length,
      notInvoiced,
    };
  }, [quotes]);

  const advancedCount =
    (filter.proposalType !== "all" ? 1 : 0) +
    (filter.client ? 1 : 0) +
    (filter.preparedBy ? 1 : 0) +
    (filter.from || filter.to ? 1 : 0) +
    (filter.deadlineRisk !== "all" ? 1 : 0) +
    (filter.stalledOnly ? 1 : 0) +
    (filter.showRejected ? 1 : 0);
  const anyFilter = advancedCount > 0 || !!filter.search || filter.stage !== "all";

  // Keep a valid selection: the first visible row when the old one drops out.
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  const open = (q: PipelineQuote) => router.push(`/pipeline/${q.id}`);
  const isWide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

  const moveSelection = (delta: number) => {
    if (rows.length === 0) return;
    const i = selected ? rows.findIndex((r) => r.id === selected.id) : -1;
    const next = rows[Math.min(rows.length - 1, Math.max(0, i + delta))];
    setSelectedId(next.id);
    const el = document.getElementById(`project-row-${next.id}`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest" });
  };

  // "/" jumps to search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = <K extends keyof Filter>(k: K, v: Filter[K]) => setFilter((f) => ({ ...f, [k]: v }));

  let lastGroup: string | null = null;
  const groupTotals = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    if (!groupKey) return m;
    for (const r of rows) {
      const k = groupKey(r);
      const g = m.get(k) ?? { count: 0, total: 0 };
      g.count++;
      g.total += r.totalCost;
      m.set(k, g);
    }
    return m;
  }, [rows, groupKey]);

  return (
    <>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-ink-strong leading-tight tracking-tight">Projects</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <SummaryLink
              onClick={() => {
                setFilter({ ...EMPTY_FILTER, stage: "sent" });
                setSort(DEFAULT_SORT);
              }}
              active={filter.stage === "sent" && advancedCount === 0 && !filter.search}
            >
              <span className="text-amber font-semibold tabnum">{summary.awaitingCount}</span> awaiting approval
              <span className="tabnum"> ({usd(summary.awaitingValue)})</span>
            </SummaryLink>
            <SummaryLink
              onClick={() => {
                setFilter({ ...EMPTY_FILTER, stage: "signed" });
                setSort(DEFAULT_SORT);
              }}
              active={filter.stage === "signed" && advancedCount === 0 && !filter.search}
            >
              <span className="text-sky font-semibold tabnum">{summary.activeCount}</span> active
              <span className="tabnum"> ({usd(summary.activeValue)})</span>
            </SummaryLink>
            <SummaryLink
              onClick={() => {
                setFilter({ ...EMPTY_FILTER, deadlineRisk: "overdue" });
                setSort(DEFAULT_SORT);
              }}
              active={filter.deadlineRisk === "overdue"}
            >
              <span className={`font-semibold tabnum ${summary.lateCount > 0 ? "text-red" : "text-ink"}`}>{summary.lateCount}</span>{" "}
              late {summary.lateCount === 1 ? "delivery" : "deliveries"}
            </SummaryLink>
            <SummaryLink
              onClick={() => {
                setFilter(EMPTY_FILTER);
                setSort({ key: "uninvoiced", dir: "desc" });
              }}
              active={sort.key === "uninvoiced" && !anyFilter}
            >
              <span className="text-ink-strong font-semibold tabnum">{usd(summary.notInvoiced)}</span> not invoiced yet
            </SummaryLink>
          </p>
        </div>
        {canEdit && (
          <Link
            href="/clients"
            title="Proposals start from an account: pick the account, then New proposal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold bg-emerald text-bg rounded-md hover:bg-emerald/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New proposal
          </Link>
        )}
      </header>

      {/* Stage tabs */}
      <div className="mb-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label="Deal stage" className="flex gap-1 border-b border-rule min-w-max">
          {STAGE_TABS.map((t) => {
            const active = filter.stage === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => set("stage", t.key)}
                className={`px-3 py-2 text-[13px] border-b-2 -mb-px whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:bg-bg-elevated ${
                  active ? "border-emerald text-ink-strong font-medium" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 tabnum text-[12px] ${active ? "text-emerald" : "text-ink-muted"}`}>
                  {tabCounts[t.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <span className="sr-only">Search projects</span>
          <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            ref={searchRef}
            type="search"
            value={filter.search}
            onChange={(e) => set("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                moveSelection(0);
              }
              if (e.key === "Enter" && selected) open(selected);
            }}
            placeholder="Search project, client, account, quote #"
            className={`${field} w-full pl-8 pr-8`}
          />
          <kbd className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 px-1.5 rounded border border-rule text-[11px] text-ink-muted">/</kbd>
        </label>

        <div role="radiogroup" aria-label="View" className="hidden md:inline-flex rounded-md border border-rule bg-surface p-0.5">
          {([
            ["list", "List", LayoutList],
            ["table", "Table", Table2],
          ] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => chooseView(v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 ${
                view === v ? "bg-bg-elevated text-ink-strong" : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="project-filters"
          className={`${field} inline-flex items-center gap-1.5 ${advancedCount > 0 ? "border-emerald/60 text-ink-strong" : ""}`}
        >
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
          Filters
          {advancedCount > 0 && <span className="tabnum text-emerald">{advancedCount}</span>}
        </button>

        <Combobox
          label="Sort"
          value={`${sort.key}:${sort.dir}`}
          options={SORT_OPTIONS.map((o) => ({ value: `${o.sort.key}:${o.sort.dir}`, label: o.label }))}
          onChange={(v) => {
            const [key, dir] = v.split(":");
            setSort({ key, dir } as Sort);
          }}
          placeholder="Sort"
          searchable={false}
          className="w-[170px]"
        />

        <Combobox
          label="Group"
          value={groupBy}
          options={[
            { value: "none", label: "No grouping" },
            { value: "client", label: "Group by client" },
            { value: "company", label: "Group by account" },
          ]}
          onChange={(v) => setGroupBy(v as GroupBy)}
          searchable={false}
          className="w-[160px]"
        />

        {anyFilter && (
          <button
            type="button"
            onClick={() => setFilter(EMPTY_FILTER)}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[12.5px] text-ink-muted hover:text-ink-strong rounded-md"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        <span className="ml-auto text-[12.5px] text-ink-muted tabnum" aria-live="polite">
          {rows.length} {rows.length === 1 ? "project" : "projects"}
          {anyFilter && <> · {usd(filtered.reduce((s, r) => s + r.totalCost, 0))}</>}
        </span>
      </div>

      {filtersOpen && (
        <div
          id="project-filters"
          className="mb-3 p-3 bg-surface border border-rule rounded-lg grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FilterField label="Type">
            <Combobox
              label="Type"
              value={filter.proposalType}
              options={[
                { value: "all", label: "All types" },
                { value: "Airtable Solutions Proposal", label: "Airtable Solutions" },
                { value: "Retainer Agreement", label: "Retainer" },
              ]}
              onChange={(v) => set("proposalType", v as Filter["proposalType"])}
            />
          </FilterField>
          <FilterField label="Client">
            <Combobox
              label="Client"
              value={filter.client ?? ""}
              options={[{ value: "", label: "All clients" }, ...clients.map((c) => ({ value: c, label: c }))]}
              onChange={(v) => set("client", v || null)}
              searchable
            />
          </FilterField>
          <FilterField label="Prepared by">
            <Combobox
              label="Prepared by"
              value={filter.preparedBy ?? ""}
              options={[{ value: "", label: "Anyone" }, ...preparers.map((p) => ({ value: p, label: p }))]}
              onChange={(v) => set("preparedBy", v || null)}
              searchable
            />
          </FilterField>
          <FilterField label="Delivery deadline">
            <Combobox
              label="Delivery deadline"
              value={filter.deadlineRisk}
              options={[
                { value: "all", label: "Any" },
                { value: "needs-attention", label: "Late or due within 7 days" },
                { value: "overdue", label: "Late" },
                { value: "red", label: "Due within 3 days" },
                { value: "yellow", label: "Due in 4–7 days" },
              ]}
              onChange={(v) => set("deadlineRisk", v as Filter["deadlineRisk"])}
            />
          </FilterField>
          <div className="min-w-0">
            <span className="block mb-1 text-[12px] text-ink-muted">Prepared between</span>
            <div className="flex items-center gap-2">
              <input type="date" aria-label="From" value={filter.from ?? ""} onChange={(e) => set("from", e.target.value || null)} className={`${field} w-full tabnum`} />
              <span className="text-ink-muted text-[12px]">and</span>
              <input type="date" aria-label="To" value={filter.to ?? ""} onChange={(e) => set("to", e.target.value || null)} className={`${field} w-full tabnum`} />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2 text-[12.5px] text-ink">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filter.stalledOnly} onChange={(e) => set("stalledOnly", e.target.checked)} className="h-4 w-4 accent-emerald" />
              Only stalled (no movement in 14+ days)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filter.showRejected} onChange={(e) => set("showRejected", e.target.checked)} className="h-4 w-4 accent-emerald" />
              Include cancelled and rejected
            </label>
          </div>
        </div>
      )}

      <div className={view === "list" ? "lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-4 lg:items-start" : ""}>
        <div className="bg-surface border border-rule rounded-lg overflow-hidden">
          {rows.length > 0 && view === "table" && (
            <div className="hidden md:block">
              <ProjectTable rows={rows} sort={sort} setSort={setSort} groupKey={groupKey} groupTotals={groupTotals} />
            </div>
          )}
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[14px] text-ink-strong">No projects match.</p>
              {anyFilter && (
                <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="mt-2 text-[13px] text-emerald hover:underline underline-offset-4">
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <ul
              ref={listRef}
              aria-label="Projects"
              // Table view is md+ only; phones always get the list.
              className={`divide-y divide-rule-soft ${view === "table" ? "md:hidden" : ""}`}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveSelection(1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveSelection(-1);
                } else if (e.key === "Enter") {
                  // Open the row that has focus, not whatever was selected before.
                  const id = (e.target as HTMLElement).id.replace("project-row-", "");
                  const q = rows.find((r) => r.id === id);
                  if (q) {
                    e.preventDefault();
                    open(q);
                  }
                }
              }}
            >
              {rows.map((q) => {
                const g = groupKey ? groupKey(q) : null;
                const header = g !== null && g !== lastGroup;
                lastGroup = g;
                const st = stageMeta(q.status);
                const flag = rowFlag(q);
                const isSel = selected?.id === q.id;
                const totals = g ? groupTotals.get(g) : undefined;
                return (
                  <li key={q.id}>
                    {header && (
                      <div className="flex items-baseline justify-between gap-3 px-4 py-2 bg-bg-elevated border-b border-rule">
                        <span className="text-[13px] font-semibold text-ink-strong truncate">{g}</span>
                        <span className="text-[12px] text-ink-muted tabnum shrink-0">
                          {totals?.count} {totals?.count === 1 ? "project" : "projects"} · {usd(totals?.total ?? 0)}
                        </span>
                      </div>
                    )}
                    <div className={`group relative flex items-stretch ${isSel ? "lg:bg-emerald-soft" : "hover:bg-bg-elevated/60"}`}>
                      <button
                        id={`project-row-${q.id}`}
                        type="button"
                        aria-current={isSel ? "true" : undefined}
                        // One tab stop for the whole list; ↑ ↓ move inside it.
                        tabIndex={isSel ? 0 : -1}
                        onFocus={() => isWide() && setSelectedId(q.id)}
                        onClick={() => (isWide() ? setSelectedId(q.id) : open(q))}
                        onDoubleClick={() => open(q)}
                        className="flex-1 min-w-0 text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald/60"
                      >
                        <span className="flex items-baseline justify-between gap-4">
                          <span className="min-w-0 truncate text-[14px] font-medium text-ink-strong">{q.projectName}</span>
                          <span className="shrink-0 text-[14px] font-semibold text-ink-strong tabnum">
                            {q.totalCost > 0 ? usdShort(q.totalCost) : <span className="text-ink-muted font-normal">—</span>}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-[12.5px] text-ink-muted">
                            {q.client}
                            {q.company && q.company !== "—" && q.company !== q.client && <span className="text-ink-muted"> · {q.company}</span>}
                            {q.autonumber && <span className="tabnum"> · #{q.autonumber}</span>}
                          </span>
                          <span className="shrink-0 flex items-center gap-2">
                            {flag && (
                              <span className={`text-[12px] font-medium tabnum ${flag.tone === "red" ? "text-red" : "text-amber"}`}>
                                {flag.text}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[11.5px] font-medium whitespace-nowrap" style={stagePillStyle(st.color)}>{st.label}</span>
                          </span>
                        </span>
                      </button>
                      <Link
                        href={`/pipeline/${q.id}`}
                        tabIndex={-1}
                        aria-label={`Open ${q.projectName}`}
                        className={`hidden lg:grid place-items-center w-10 shrink-0 text-ink-muted hover:text-emerald focus-visible:outline-none focus-visible:text-emerald ${
                          isSel ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        }`}
                      >
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside
          aria-label="Project preview"
          // The border takes the selected project's stage colour.
          style={selected ? { borderColor: `${stageMeta(selected.status).color}99` } : undefined}
          className={`${view === "list" ? "hidden lg:block" : "hidden"} sticky top-14 bg-surface border border-rule rounded-lg max-h-[calc(100vh-4.5rem)] overflow-y-auto transition-colors duration-300`}
        >
          <ProjectPreview
            quote={selected}
            canEdit={canEdit}
            onStageChange={(id, status) => setStageOverrides((m) => ({ ...m, [id]: status }))}
          />
        </aside>
      </div>
    </>
  );
}

function SummaryLink({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded hover:text-ink-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 ${
        active ? "text-ink-strong underline" : ""
      }`}
    >
      {children}
    </button>
  );
}

// A div, not a <label>: a label re-clicks its control, which would reopen the
// dropdown right after an option is picked. The Combobox names itself.
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block mb-1 text-[12px] text-ink-muted" aria-hidden="true">{label}</span>
      {children}
    </div>
  );
}
