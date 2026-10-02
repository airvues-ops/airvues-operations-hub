"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { PipelineQuote } from "@/lib/pipeline";
import { rowFlag, stageMeta, usd } from "./project-list";
import type { Sort, SortKey } from "./types";

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
    : "—";

type Col = { label: string; sortKey?: SortKey; align?: "right"; className?: string };

const COLS: Col[] = [
  { label: "Project", sortKey: "autonumber", className: "min-w-[220px]" },
  { label: "Client / account", sortKey: "client", className: "min-w-[170px]" },
  { label: "Stage", sortKey: "status" },
  { label: "Value", sortKey: "totalCost", align: "right" },
  { label: "Invoiced", sortKey: "invoiced", align: "right" },
  { label: "Not invoiced", sortKey: "uninvoiced", align: "right" },
  { label: "Delivery" },
  { label: "Prepared", sortKey: "preparedDate" },
];

/**
 * Table view of Projects for comparing across rows. Every column fits at
 * laptop width; headers sort; a row opens its project (Cmd/Ctrl-click opens
 * a new tab). Shown from md up — phones get the list.
 */
export function ProjectTable({
  rows,
  sort,
  setSort,
  groupKey,
  groupTotals,
}: {
  rows: PipelineQuote[];
  sort: Sort;
  setSort: (s: Sort) => void;
  groupKey: ((q: PipelineQuote) => string) | null;
  groupTotals: Map<string, { count: number; total: number }>;
}) {
  const router = useRouter();

  const toggle = (key: SortKey) =>
    setSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "client" || key === "status" ? "asc" : "desc" });

  let lastGroup: string | null = null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-rule text-left">
            {COLS.map((c) => {
              const active = c.sortKey && sort.key === c.sortKey;
              return (
                <th
                  key={c.label}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={`px-3 py-2.5 font-medium text-[12px] text-ink-muted whitespace-nowrap ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                >
                  {c.sortKey ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.sortKey!)}
                      className={`inline-flex items-center gap-1 rounded hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 ${active ? "text-ink-strong" : ""}`}
                    >
                      {c.label}
                      {active &&
                        (sort.dir === "asc" ? (
                          <ArrowUp aria-hidden="true" className="h-3 w-3 text-emerald" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="h-3 w-3 text-emerald" />
                        ))}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule-soft">
          {rows.map((q) => {
            const g = groupKey ? groupKey(q) : null;
            const header = g !== null && g !== lastGroup;
            lastGroup = g;
            const totals = g ? groupTotals.get(g) : undefined;
            const st = stageMeta(q.status);
            const flag = rowFlag(q);
            // Late / due-soon belong to Delivery; "waiting" / "draft" belong to Stage.
            const deadlineFlag = flag && /late|Due/.test(flag.text) ? flag : null;
            const stageFlag = flag && !deadlineFlag ? flag : null;
            const href = `/pipeline/${q.id}`;
            const go = (e: React.MouseEvent) => {
              if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
              else router.push(href);
            };
            return (
              <Fragment key={q.id}>
                {header && (
                  <tr className="bg-bg-elevated">
                    <td colSpan={COLS.length} className="px-3 py-2">
                      <span className="text-[13px] font-semibold text-ink-strong">{g}</span>
                      <span className="ml-3 text-[12px] text-ink-muted tabnum">
                        {totals?.count} {totals?.count === 1 ? "project" : "projects"} · {usd(totals?.total ?? 0)}
                      </span>
                    </td>
                  </tr>
                )}
                <tr onClick={go} className="cursor-pointer hover:bg-bg-elevated/60 align-top">
                  <td className="px-3 py-2.5 min-w-[220px] max-w-[340px]">
                    {/* The name is the real link: keyboard and screen-reader path. */}
                    <a
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      className="block font-medium text-ink-strong truncate hover:text-emerald focus-visible:outline-none focus-visible:underline"
                    >
                      {q.projectName}
                    </a>
                    {q.autonumber && <span className="text-[12px] text-ink-muted tabnum">#{q.autonumber}</span>}
                  </td>
                  <td className="px-3 py-2.5 max-w-[240px]">
                    <div className="truncate text-ink">{q.client}</div>
                    {q.company && q.company !== "—" && q.company !== q.client && (
                      <div className="truncate text-[12px] text-ink-muted">{q.company}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${st.tone}`}>{st.label}</span>
                    {stageFlag && <div className="mt-1 text-[12px] font-medium tabnum text-amber">{stageFlag.text}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabnum font-semibold text-ink-strong whitespace-nowrap">
                    {q.totalCost > 0 ? usd(q.totalCost) : <span className="text-ink-muted font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabnum whitespace-nowrap text-ink">
                    {q.invoiced > 0 ? usd(q.invoiced) : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabnum whitespace-nowrap ${q.uninvoiced > 0 ? "text-amber font-medium" : "text-ink-muted"}`}>
                    {q.uninvoiced > 0 ? usd(q.uninvoiced) : "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="tabnum text-ink">{fmtDate(q.deliveryDueDate)}</div>
                    {deadlineFlag && (
                      <div className={`text-[12px] font-medium tabnum ${deadlineFlag.tone === "red" ? "text-red" : "text-amber"}`}>{deadlineFlag.text}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="tabnum text-ink">{fmtDate(q.preparedDate)}</div>
                    {q.preparedBy && q.preparedBy !== "—" && (
                      <div className="text-[12px] text-ink-muted truncate max-w-[140px]">{q.preparedBy}</div>
                    )}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
