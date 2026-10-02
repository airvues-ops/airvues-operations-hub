"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import {
  loadQuoteDetail,
  loadStoryDetail,
  updateQuoteFields,
  attachQuoteDocuments,
  triggerAiProposalAgent,
  triggerAiChangeOrderAgent,
} from "@/lib/mutations/quote";
import type { Story } from "@/lib/engineering-types";
import { StorySheet } from "@/components/engineering/StorySheet";
import { DrawerErrorBoundary } from "./DrawerErrorBoundary";
import type {
  PersonOption,
  QuoteAttachment,
  QuoteDetail,
  QuoteFieldPatch,
} from "@/lib/quote-types";
import {
  PROJECT_STATUS_CHOICES,
  PROPOSAL_TYPE_CHOICES,
} from "@/lib/quote-types";
import {
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_BATCH,
  UPLOAD_MAX_BYTES,
  sanitizeUploadFilename,
} from "@/lib/uploads";
import { PersonPicker } from "./PersonPicker";
import { MultiPersonPicker } from "./MultiPersonPicker";
import { QuoteStoriesTable } from "./QuoteStoriesTable";
import { NewQuoteStoryModal } from "./NewQuoteStoryModal";
import { ChevronDown, Eye, Lock, Plus } from "lucide-react";
import { StageSection, type StageState } from "@/components/projects/StageSection";
import { ProjectOverview, type OverviewMoney } from "@/components/projects/ProjectOverview";

type SprintOption = { id: string; number: number | null; status: string | null };

type Props = {
  quoteId: string;
  initial?: QuoteDetail | null;
  people: PersonOption[];
  sprints: SprintOption[];
  canEdit: boolean;
  /** Page mode: shows the lifecycle overview and orders sections by stage. */
  overview?: OverviewMoney;
  /** Page mode: sections rendered after change orders (invoices, activity). */
  afterScope?: React.ReactNode;
};

const inputCls =
  "w-full px-2.5 py-1.5 text-[12px] bg-bg-elevated border border-rule text-ink rounded-md focus:border-emerald focus:outline-none transition-colors disabled:opacity-50";
const selectCls = `${inputCls} cursor-pointer`;

// Defensive: Airtable rich-text / formula / rollup fields can return non-string
// values (e.g. { specialValue: "NaN" } from a broken formula). Coerce so
// downstream React renders + .trim() calls never throw and unmount the drawer.
function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}


// (ClientVisibleChip removed — all client-facing fields now use PortalChip
// so the labeling is consistent with the AI proposal section.)


// Who sees a field. Shown as a small icon rather than a badge on every label:
// the distinction matters, but it isn't what people are reading for.
function InternalChip() {
  return (
    <span className="inline-flex text-ink-faint" title="Internal — only the Airvues team sees this">
      <Lock aria-hidden="true" className="h-3 w-3" />
      <span className="sr-only">Internal only</span>
    </span>
  );
}

function PortalChip() {
  return (
    <span className="inline-flex text-sky/80" title="Shown to the client on the web quote and portal">
      <Eye aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="sr-only">Visible to the client</span>
    </span>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error"; }) {
  if (state === "idle") return null;
  const map = {
    saving: { text: "Saving…", cls: "text-ink-faint" },
    saved: { text: "Saved", cls: "text-emerald" },
    error: { text: "Save failed", cls: "text-red" },
  } as const;
  const { text, cls } = map[state];
  return <span className={`text-[11px] ${cls}`}>{text}</span>;
}

function FieldRow({
  label,
  hint,
  chip,
  children,
  state,
  variant = "row",
  className,
}: {
  label: string;
  hint?: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
  state?: "idle" | "saving" | "saved" | "error";
  /** "row" = full-width bordered row (default). "cell" = grid cell, no border/horizontal padding. */
  variant?: "row" | "cell";
  className?: string;
}) {
  const wrapCls =
    variant === "cell"
      ? `py-2 ${className ?? ""}`
      : `px-5 py-3 border-b border-rule-soft last:border-0 ${className ?? ""}`;
  return (
    <div className={wrapCls}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-[12px] font-medium text-ink-muted">{label}</label>
          {chip}
        </div>
        <SaveIndicator state={state ?? "idle"} />
      </div>
      {hint && <div className="text-[12px] text-ink-faint mb-1.5">{hint}</div>}
      {children}
    </div>
  );
}

/** Obvious-affordance collapsible used for long-text fields inside a section.
 *  Mirrors the LeadSheet CollapsibleNotes pattern (chevron-left + emerald accent
 *  + character count). */
function CollapsibleField({
  title,
  open,
  onToggle,
  charCount,
  emptyHint,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  charCount: number;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-rule rounded-md bg-bg-elevated/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-stretch text-left hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
      >
        <span className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2">
          <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 text-ink-muted transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-[12px] font-medium text-ink-strong">{title}</span>
          {charCount > 0 ? (
            <span className="text-[12px] text-ink-muted tabnum">{charCount.toLocaleString()} characters</span>
          ) : (
            emptyHint && <span className="text-[10px] text-ink-faint italic">{emptyHint}</span>
          )}
        </span>
      </button>
      {open && <div className="px-3 py-2 border-t border-rule">{children}</div>}
    </div>
  );
}

/** Self-contained collapsible field — persists open/closed per (quote, key) in
 *  localStorage. Default collapsed when initial content > 400 chars. */
function CollapsibleFieldWrapper({
  storageKey,
  title,
  initialContent,
  emptyHint,
  children,
}: {
  storageKey: string;
  title: string;
  initialContent: string;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  const longThreshold = 400;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return initialContent.length <= longThreshold;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return initialContent.length <= longThreshold;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, open ? "1" : "0");
    }
  }, [storageKey, open]);
  return (
    <CollapsibleField
      title={title}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      charCount={initialContent.length}
      emptyHint={emptyHint}
    >
      {children}
    </CollapsibleField>
  );
}

// Generic text field that autosaves on blur. Tracks its own dirty state so
// re-renders from parent (after quote refresh) don't fight the user's typing.
function TextField({
  initialValue,
  onSave,
  multiline = false,
  rows = 3,
  placeholder,
  disabled,
  fontMono = false,
}: {
  initialValue: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  fontMono?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const lastSaved = useRef(initialValue);

  useEffect(() => {
    // Adopt server value only if user isn't mid-edit.
    if (!pending && value === lastSaved.current) {
      setValue(initialValue);
      lastSaved.current = initialValue;
    }
  }, [initialValue, pending, value]);

  const commit = async () => {
    if (value === lastSaved.current) return;
    setPending(true);
    try {
      await onSave(value);
      lastSaved.current = value;
    } finally {
      setPending(false);
    }
  };

  const cls = `${inputCls} ${fontMono ? "font-mono" : ""}`;
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      disabled={disabled || pending}
      rows={rows}
      placeholder={placeholder}
      className={`${cls} resize-y`}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      disabled={disabled || pending}
      placeholder={placeholder}
      className={cls}
    />
  );
}

// ---------- Attachments (Documents needed for Proposal) ----------

type UploadRow = { key: string; filename: string; status: "uploading" | "saving" | "error"; error?: string };

function fmtBytes(n: number | null): string {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function QuoteAttachments({
  quoteId,
  attachments,
  setAttachments,
  canEdit,
}: {
  quoteId: string;
  attachments: QuoteAttachment[];
  setAttachments: (next: QuoteAttachment[]) => void;
  canEdit: boolean;
}) {
  const [pending, setPending] = useState<UploadRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const allowedSet = new Set<string>(UPLOAD_ALLOWED_MIME);

  const handleFiles = async (filesList: FileList | File[]) => {
    setGlobalError(null);
    const files = Array.from(filesList);
    if (files.length === 0) return;
    if (files.length > UPLOAD_MAX_BATCH) {
      setGlobalError(`Up to ${UPLOAD_MAX_BATCH} files per batch.`);
      return;
    }
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      if (f.size > UPLOAD_MAX_BYTES) {
        rejected.push(`${f.name} (too large)`);
        continue;
      }
      if (f.type && !allowedSet.has(f.type)) {
        rejected.push(`${f.name} (type ${f.type} not allowed)`);
        continue;
      }
      accepted.push(f);
    }
    if (rejected.length) setGlobalError(`Rejected: ${rejected.join("; ")}`);
    if (accepted.length === 0) return;

    const rows: UploadRow[] = accepted.map((f, i) => ({
      key: `${Date.now()}-${i}-${f.name}`,
      filename: f.name,
      status: "uploading",
    }));
    setPending((p) => [...p, ...rows]);

    const uploaded: { url: string; filename: string; rowKey: string }[] = [];
    await Promise.all(
      accepted.map(async (file, i) => {
        const row = rows[i];
        try {
          const pathname = `quotes/${quoteId}/${Date.now()}-${sanitizeUploadFilename(file.name)}`;
          const blob = await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/quotes/upload",
            clientPayload: JSON.stringify({ quoteId }),
            contentType: file.type || undefined,
          });
          uploaded.push({ url: blob.url, filename: file.name, rowKey: row.key });
          setPending((p) =>
            p.map((r) => (r.key === row.key ? { ...r, status: "saving" } : r)),
          );
        } catch (e) {
          setPending((p) =>
            p.map((r) =>
              r.key === row.key
                ? { ...r, status: "error", error: (e as Error).message }
                : r,
            ),
          );
        }
      }),
    );

    if (uploaded.length === 0) return;

    const res = await attachQuoteDocuments({
      quoteId,
      files: uploaded.map(({ url, filename }) => ({ url, filename })),
    });

    if ("error" in res) {
      setGlobalError(res.error);
      setPending((p) =>
        p.map((r) =>
          uploaded.some((u) => u.rowKey === r.key)
            ? { ...r, status: "error", error: res.error }
            : r,
        ),
      );
      return;
    }
    setAttachments(res.attachments);
    setPending((p) => p.filter((r) => !uploaded.some((u) => u.rowKey === r.key)));
  };

  return (
    <div className="space-y-2">
      {(attachments.length > 0 || pending.length > 0) && (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-bg-elevated border border-rule rounded"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-emerald hover:underline truncate"
                title={a.filename}
              >
                📎 {a.filename}
              </a>
              <span className="text-[10px] font-mono text-ink-faint shrink-0">{fmtBytes(a.size)}</span>
            </li>
          ))}
          {pending.map((r) => (
            <li
              key={r.key}
              className={`flex items-center justify-between gap-2 px-3 py-2 border rounded ${
                r.status === "error" ? "bg-red/5 border-red/40" : "bg-bg-elevated border-rule"
              }`}
            >
              <span className="text-[12px] text-ink truncate" title={r.filename}>
                {r.status === "uploading" ? "⬆️" : r.status === "saving" ? "💾" : "⚠️"} {r.filename}
              </span>
              <span className="text-[10px] font-mono text-ink-faint shrink-0">
                {r.status === "uploading" && "uploading…"}
                {r.status === "saving" && "saving…"}
                {r.status === "error" && (r.error ?? "failed")}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
          }}
          className={`block cursor-pointer px-3 py-4 border border-dashed rounded text-[12px] text-center transition-colors ${
            dragOver
              ? "border-emerald bg-emerald/5 text-emerald"
              : "border-rule bg-bg-elevated text-ink-muted hover:border-ink-muted hover:text-ink"
          }`}
        >
          <input
            type="file"
            multiple
            className="hidden"
            accept={UPLOAD_ALLOWED_MIME.join(",")}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          Attach any documents from client (requirements, screenshots, etc.)
          <div className="mt-0.5 text-[10px] text-ink-faint">
            Up to {UPLOAD_MAX_BATCH} files · {(UPLOAD_MAX_BYTES / 1024 / 1024).toFixed(0)} MB each
          </div>
        </label>
      )}

      {!canEdit && attachments.length === 0 && (
        <div className="px-3 py-3 bg-bg-elevated border border-dashed border-rule rounded text-[12px] text-ink-faint text-center">
          No documents attached.
        </div>
      )}

      {globalError && <div className="text-[11px] text-red">{globalError}</div>}
    </div>
  );
}

// ---------- Editable AI field (read-only by default, click to edit) ----------

function AiField({
  value,
  onSave,
  canEdit,
  rows = 4,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  canEdit: boolean;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <div>
        {value ? (
          <div className="text-[13px] text-ink whitespace-pre-wrap break-words bg-bg-elevated border border-rule rounded p-2.5">
            {value}
          </div>
        ) : (
          <div className="text-[12px] text-ink-faint italic px-2.5 py-2 border border-dashed border-rule rounded">
            Not yet generated by the AI proposal agent.
          </div>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1.5 text-[11px] text-emerald hover:underline"
          >
            {value ? "Edit" : "Add manually"}
          </button>
        )}
      </div>
    );
  }

  const save = async () => {
    setErr(null);
    setPending(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={rows}
        disabled={pending}
        className={`${inputCls} resize-y`}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="px-3 py-1.5 text-[12px] bg-emerald text-bg font-medium rounded hover:bg-emerald/80 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(false);
            setErr(null);
          }}
          disabled={pending}
          className="px-3 py-1.5 text-[12px] bg-bg-elevated border border-rule text-ink rounded hover:border-ink-muted"
        >
          Cancel
        </button>
        {err && <span className="text-[11px] text-red">{err}</span>}
      </div>
    </div>
  );
}

// ---------- Create AI Proposal button row ----------

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// Airtable un-checks the "Run AI ... Agent" box when the automation finishes,
// so a run that errored leaves the UI reporting "Generating…" forever with the
// primary button disabled. This is the way back out — and after adding more
// context, the way to re-run without waiting on a run that is never coming.
function RerunAnyway({ onClick, what }: { onClick: () => void; what: string }) {
  return (
    <div className="mt-2 text-[11px] text-ink-faint">
      Added more context, or the run looks stuck?{" "}
      <button
        type="button"
        onClick={onClick}
        className="underline underline-offset-2 text-ink-muted hover:text-emerald"
      >
        Re-run the {what} agent anyway
      </button>
    </div>
  );
}

function CreateAiProposalRow({
  canEdit,
  hasClientInput,
  aiContentReady,
  isAgentRunning,
  isTriggering,
  pollStartedAt,
  pollTick,
  error,
  onClick,
}: {
  canEdit: boolean;
  hasClientInput: boolean;
  aiContentReady: boolean;
  isAgentRunning: boolean;
  isTriggering: boolean;
  pollStartedAt: number | null;
  pollTick: number;
  error: string | null;
  onClick: () => void;
}) {
  // pollTick is read so React re-renders the elapsed counter every poll.
  void pollTick;

  const disabledReason = !canEdit
    ? "Read-only access"
    : !hasClientInput && !aiContentReady
      ? "Add a problem statement or attach documents first."
      : null;

  const label = isTriggering
    ? "Starting…"
    : isAgentRunning
      ? "Generating proposal…"
      : aiContentReady
        ? "Re-run AI Proposal"
        : "Create AI Proposal";

  const disabled = isTriggering || isAgentRunning || disabledReason !== null;

  return (
    <div className="px-5 py-4 border-t border-rule-soft bg-bg-elevated/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-ink-muted">
          {isAgentRunning ? (
            <>
              <span className="text-sky font-medium">Generating proposal…</span>{" "}
              <span className="text-ink-faint">
                usually 1–2 minutes
                {pollStartedAt ? ` · ${formatElapsed(Date.now() - pollStartedAt)} elapsed` : ""}
              </span>
            </>
          ) : aiContentReady ? (
            <span className="text-emerald">Proposal generated. Edits below override AI output.</span>
          ) : (
            "Once client input is captured, run the AI agent to draft the proposal + quote calculator."
          )}
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={disabledReason ?? undefined}
          className={`px-3.5 py-2 text-[12px] font-semibold rounded transition-colors inline-flex items-center gap-2 ${
            disabled
              ? "bg-bg-elevated text-ink-faint border border-rule cursor-not-allowed"
              : aiContentReady
                ? "bg-bg-elevated text-ink border border-rule hover:border-emerald hover:text-emerald"
                : "bg-emerald text-bg hover:bg-emerald/80"
          }`}
        >
          {isAgentRunning || isTriggering ? (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : null}
          <span>{label}</span>
        </button>
      </div>
      {isAgentRunning && canEdit && !isTriggering && (
        <RerunAnyway onClick={onClick} what="proposal" />
      )}
      {error ? (
        <div className="mt-2 text-[11px] text-red">⚠ {error}</div>
      ) : null}
    </div>
  );
}

function CreateAiChangeOrderRow({
  canEdit,
  hasInput,
  aiContentReady,
  isAgentRunning,
  isTriggering,
  pollStartedAt,
  pollTick,
  error,
  onClick,
}: {
  canEdit: boolean;
  hasInput: boolean;
  aiContentReady: boolean;
  isAgentRunning: boolean;
  isTriggering: boolean;
  pollStartedAt: number | null;
  pollTick: number;
  error: string | null;
  onClick: () => void;
}) {
  void pollTick;

  const disabledReason = !canEdit
    ? "Read-only access"
    : !hasInput
      ? "Add change order input details first."
      : null;

  const label = isTriggering
    ? "Starting…"
    : isAgentRunning
      ? "Generating change order…"
      : aiContentReady
        ? "Re-run Change Order"
        : "Create Change Order";

  const disabled = isTriggering || isAgentRunning || disabledReason !== null;

  return (
    <div className="mt-3 px-3 py-3 border border-rule-soft rounded bg-bg-elevated/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] text-ink-muted">
          {isAgentRunning ? (
            <>
              <span className="text-sky font-medium">Generating change order…</span>{" "}
              <span className="text-ink-faint">
                usually 1–2 minutes
                {pollStartedAt ? ` · ${formatElapsed(Date.now() - pollStartedAt)} elapsed` : ""}
              </span>
            </>
          ) : aiContentReady ? (
            <span className="text-emerald">Change order generated. Edits below override AI output.</span>
          ) : (
            "Run the AI agent to draft the change order summary + stories from the input above."
          )}
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={disabledReason ?? undefined}
          className={`px-3.5 py-2 text-[12px] font-semibold rounded transition-colors inline-flex items-center gap-2 ${
            disabled
              ? "bg-bg-elevated text-ink-faint border border-rule cursor-not-allowed"
              : aiContentReady
                ? "bg-bg-elevated text-ink border border-rule hover:border-emerald hover:text-emerald"
                : "bg-emerald text-bg hover:bg-emerald/80"
          }`}
        >
          {isAgentRunning || isTriggering ? (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : null}
          <span>{label}</span>
        </button>
      </div>
      {isAgentRunning && canEdit && !isTriggering && (
        <RerunAnyway onClick={onClick} what="change order" />
      )}
      {error ? <div className="mt-2 text-[11px] text-red">⚠ {error}</div> : null}
    </div>
  );
}

// ---------- Main editor ----------


export function QuoteSheetEditor({ quoteId, initial, people, sprints, canEdit, overview, afterScope }: Props) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetail | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [showAddStory, setShowAddStory] = useState(false);
  const [showAddChangeOrder, setShowAddChangeOrder] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [lastSavedField, setLastSavedField] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  const openStory = (storyId: string) => {
    setStoryLoading(true);
    loadStoryDetail(storyId).then((res) => {
      setStoryLoading(false);
      if ("ok" in res) setSelectedStory(res.story);
    });
  };

  const closeStory = () => {
    setSelectedStory(null);
    // Re-fetch the quote so any edits to Hours/Cost/Status are reflected in the
    // calculator and the Total Cost rollup.
    loadQuoteDetail(quoteId).then((res) => {
      if ("ok" in res) setQuote(res.quote);
    });
    router.refresh();
  };

  // ---- AI proposal trigger + polling ----
  const [aiTriggering, setAiTriggering] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [pollTick, setPollTick] = useState(0);
  const isAgentRunning = quote?.runAiProposalAgent === true;

  // Poll every 10s while the agent is running. Auto-stops when checkbox flips
  // back to false (Airtable automation un-checks at completion) or after 5 min.
  useEffect(() => {
    if (!isAgentRunning) {
      setPollStartedAt(null);
      return;
    }
    if (pollStartedAt === null) setPollStartedAt(Date.now());
    const startedAt = pollStartedAt ?? Date.now();
    let alive = true;
    const tick = setInterval(() => {
      if (!alive) return;
      // 5 min safety cutoff
      if (Date.now() - startedAt > 5 * 60_000) {
        clearInterval(tick);
        return;
      }
      loadQuoteDetail(quoteId).then((res) => {
        if (!alive) return;
        if ("ok" in res) setQuote(res.quote);
        setPollTick((t) => t + 1);
      });
    }, 10_000);
    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [isAgentRunning, quoteId, pollStartedAt]);

  const handleTriggerAi = async () => {
    setAiError(null);
    setAiTriggering(true);
    const res = await triggerAiProposalAgent(quoteId);
    setAiTriggering(false);
    if ("ok" in res) {
      setQuote(res.quote);
      setPollStartedAt(Date.now());
    } else {
      setAiError(res.error);
    }
  };

  // ---- AI change order trigger + polling ----
  const [coAiTriggering, setCoAiTriggering] = useState(false);
  const [coAiError, setCoAiError] = useState<string | null>(null);
  const [coPollStartedAt, setCoPollStartedAt] = useState<number | null>(null);
  const [coPollTick, setCoPollTick] = useState(0);
  const isCoAgentRunning = quote?.runAiChangeOrderAgent === true;

  useEffect(() => {
    if (!isCoAgentRunning) {
      setCoPollStartedAt(null);
      return;
    }
    if (coPollStartedAt === null) setCoPollStartedAt(Date.now());
    const startedAt = coPollStartedAt ?? Date.now();
    let alive = true;
    const tick = setInterval(() => {
      if (!alive) return;
      if (Date.now() - startedAt > 5 * 60_000) {
        clearInterval(tick);
        return;
      }
      loadQuoteDetail(quoteId).then((res) => {
        if (!alive) return;
        if ("ok" in res) setQuote(res.quote);
        setCoPollTick((t) => t + 1);
      });
    }, 10_000);
    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [isCoAgentRunning, quoteId, coPollStartedAt]);

  const handleTriggerCoAi = async () => {
    setCoAiError(null);
    setCoAiTriggering(true);
    const res = await triggerAiChangeOrderAgent(quoteId);
    setCoAiTriggering(false);
    if ("ok" in res) {
      setQuote(res.quote);
      setCoPollStartedAt(Date.now());
    } else {
      setCoAiError(res.error);
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadErr(null);
    loadQuoteDetail(quoteId).then((res) => {
      if (!alive) return;
      if ("error" in res) setLoadErr(res.error);
      else setQuote(res.quote);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [quoteId]);

  const originalStories = useMemo(
    () => (quote?.stories ?? []).filter((s) => !s.isChangeOrder),
    [quote?.stories],
  );
  const changeOrderStories = useMemo(
    () => (quote?.stories ?? []).filter((s) => s.isChangeOrder),
    [quote?.stories],
  );

  if (loading && !quote) {
    return <div className="px-5 py-8 text-[12px] text-ink-faint">Loading quote details…</div>;
  }
  if (loadErr) {
    return (
      <div className="mx-5 my-4 bg-red/10 border border-red/30 rounded p-3 text-[12px] text-red">
        Failed to load quote: {loadErr}
      </div>
    );
  }
  if (!quote) return null;

  const patchAndRefresh = (
    fieldKey: string,
    patch: QuoteFieldPatch,
  ): Promise<void> =>
    new Promise((resolve) => {
      setSavingField(fieldKey);
      startTransition(async () => {
        const res = await updateQuoteFields(quoteId, patch);
        setSavingField(null);
        if ("ok" in res) {
          setQuote(res.quote);
          setLastSavedField(fieldKey);
          setTimeout(() => {
            setLastSavedField((curr) => (curr === fieldKey ? null : curr));
          }, 1500);
        }
        resolve();
      });
    });

  const stateFor = (k: string): "idle" | "saving" | "saved" | "error" => {
    if (savingField === k) return "saving";
    if (lastSavedField === k) return "saved";
    return "idle";
  };

  const isRetainer = quote.proposalType === "Retainer Agreement";
  const pageMode = !!overview;
  const journeyIdx = (PROJECT_STATUS_CHOICES as readonly string[]).indexOf(quote.projectStatus ?? "");
  const storiesDone = originalStories.filter((st) => st.status === "Completed").length;
  const hasClientInput =
    asStr(quote.customProblemStatement).trim().length > 0 || quote.documents.length > 0;
  const aiReady =
    asStr(quote.recommendedApproach).trim().length > 0 &&
    asStr(quote.recommendedApproachSummary).trim().length > 0 &&
    asStr(quote.projectOverview).trim().length > 0 &&
    asStr(quote.problemStatementSolution).trim().length > 0 &&
    asStr(quote.estimateCostRange).trim().length > 0 &&
    quote.stories.length > 0;

  // Where each section sits in the lifecycle (page mode only).
  const proposalDone = journeyIdx >= 2; // signed
  const proposalState: StageState | undefined = pageMode ? (proposalDone ? "done" : "current") : undefined;
  const scopeState: StageState | undefined = !pageMode
    ? undefined
    : journeyIdx >= PROJECT_STATUS_CHOICES.length - 1
      ? "done"
      : journeyIdx >= 2
        ? "current"
        : "upcoming";

  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const personName = (id: string | null) => people.find((p) => p.id === id)?.name ?? null;
  const k = (name: string) => `pj:${quoteId}:${name}`;

  const proposalSummary = aiReady
    ? "AI proposal ready"
    : isAgentRunning
      ? "Generating proposal…"
      : hasClientInput
        ? "Client input added, proposal not generated yet"
        : "Waiting on client input";
  const scopeSummary =
    originalStories.length === 0
      ? "No stories yet"
      : isRetainer
        ? `${originalStories.length} ${originalStories.length === 1 ? "story" : "stories"} · ${quote.originalTotalHours ?? 0}h`
        : `${storiesDone} of ${originalStories.length} done · ${quote.originalTotalHours ?? 0}h · ${fmtUsd(quote.originalTotalCost)}`;
  const coSummary =
    changeOrderStories.length === 0
      ? "None"
      : `${changeOrderStories.length} ${changeOrderStories.length === 1 ? "story" : "stories"} · ${fmtUsd(quote.changeOrderTotalCost)}`;
  const detailsSummary = [
    personName(quote.preparedById) ? `Prepared by ${personName(quote.preparedById)}` : null,
    quote.proposalType,
    personName(quote.epicOwnerId) ? `Lead engineer ${personName(quote.epicOwnerId)}` : "No lead engineer",
  ]
    .filter(Boolean)
    .join(" · ");

  const addButton = (label: string, onClick: () => void) =>
    canEdit ? (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-emerald text-bg rounded-md hover:bg-emerald/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </button>
    ) : null;

  const detailsSection = (
    <StageSection
      title="Project details"
      summary={detailsSummary}
      defaultOpen={!pageMode}
      storageKey={k("details")}
    >
        <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <FieldRow label="Project name" chip={<PortalChip />} state={stateFor("projectName")} variant="cell" className="md:col-span-2">

          <TextField
            initialValue={quote.projectName}
            disabled={!canEdit}
            onSave={(v) => patchAndRefresh("projectName", { projectName: v })}
            placeholder="Project name shown to the client"
          />
        </FieldRow>

        <FieldRow label="Prepared by" chip={<PortalChip />} state={stateFor("preparedById")} variant="cell">
          <PersonPicker
            value={quote.preparedById}
            options={people}
            disabled={!canEdit}
            placeholder="Pick the Airvues lead"
            onChange={(id) => void patchAndRefresh("preparedById", { preparedById: id })}
          />
        </FieldRow>


        <FieldRow label="Prepared date" chip={<PortalChip />} state={stateFor("preparedDate")} variant="cell">
          <input
            type="date"
            value={quote.preparedDate ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              void patchAndRefresh("preparedDate", { preparedDate: e.target.value || null })
            }
            className={`${inputCls} tabnum w-auto`}
          />
        </FieldRow>

        {quote.proposalType !== "Retainer Agreement" && (
        <FieldRow
          label="Delivery due date"
          hint="Drives the deadline badge on Projects."
          chip={<PortalChip />}
          state={stateFor("deliveryDueDate")}
          variant="cell"
        >
          <input
            type="date"
            value={quote.deliveryDueDate ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              void patchAndRefresh("deliveryDueDate", { deliveryDueDate: e.target.value || null })
            }
            className={`${inputCls} tabnum w-auto`}
          />
        </FieldRow>
        )}

        <FieldRow label="Prepared for" chip={<PortalChip />} state={stateFor("preparedForIds")} variant="cell">
          <MultiPersonPicker
            values={quote.preparedForIds}
            options={people}
            disabled={!canEdit}
            placeholder="Pick client contact(s)"
            onChange={(ids) => void patchAndRefresh("preparedForIds", { preparedForIds: ids })}
          />
        </FieldRow>

        {!pageMode && (
        <FieldRow
          label="Client journey stage"
          hint="Drives the progress bar on the client's web quote."
          chip={<PortalChip />}
          state={stateFor("projectStatus")}
          variant="cell"
        >
          <select
            value={quote.projectStatus ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              void patchAndRefresh("projectStatus", { projectStatus: e.target.value || null })
            }
            className={selectCls}
          >
            <option value="">— select —</option>
            {PROJECT_STATUS_CHOICES.map((s, i) => (
              <option key={s} value={s}>
                {i + 1}. {s}
              </option>
            ))}
          </select>
        </FieldRow>

        )}

        <FieldRow label="Proposal type" chip={<PortalChip />} state={stateFor("proposalType")} variant="cell">
          <select
            value={quote.proposalType ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              void patchAndRefresh("proposalType", { proposalType: e.target.value || null })
            }
            className={selectCls}
          >
            <option value="">— select —</option>
            {PROPOSAL_TYPE_CHOICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow
          label="Lead engineer"
          hint="Engineer responsible for delivery."
          chip={<InternalChip />}
          state={stateFor("epicOwnerId")}
          variant="cell"
        >
          <PersonPicker
            value={quote.epicOwnerId}
            options={people.filter((p) => p.isInternal && p.isActive)}
            disabled={!canEdit}
            placeholder="Pick the lead engineer"
            onChange={(id) => void patchAndRefresh("epicOwnerId", { epicOwnerId: id })}
          />
        </FieldRow>

        {quote.proposalType !== "Retainer Agreement" && (
        <FieldRow
          label="Blueprint engagement"
          hint="Gives the person in Prepared by a +5% commission bonus."
          chip={<InternalChip />}
          state={stateFor("blueprint")}
          variant="cell"
        >
          <label className="inline-flex items-center gap-2 text-[12px] text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={quote.blueprint}
              disabled={!canEdit}
              onChange={(e) =>
                void patchAndRefresh("blueprint", { blueprint: e.target.checked })
              }
              className="h-4 w-4 accent-emerald cursor-pointer"
            />
            <span>{quote.blueprint ? "Yes — +5% commission bonus" : "No"}</span>
          </label>
        </FieldRow>
        )}
        </div>
    </StageSection>
  );

  return (
    <>
      {pageMode && overview && (
        <ProjectOverview
          journey={quote.projectStatus}
          onSetJourney={(step) => void patchAndRefresh("projectStatus", { projectStatus: step })}
          saving={savingField === "projectStatus"}
          canEdit={canEdit}
          totalCost={quote.originalTotalCost + quote.changeOrderTotalCost}
          money={overview}
          storiesDone={storiesDone}
          storiesTotal={originalStories.length}
          hours={quote.originalTotalHours}
          deliveryDueDate={quote.deliveryDueDate}
        />
      )}

      {!pageMode && detailsSection}

      {!isRetainer && (
        <StageSection
          id="proposal"
          title="Proposal"
          summary={proposalSummary}
          state={proposalState}
          defaultOpen={!pageMode || !proposalDone}
          storageKey={k("proposal")}
        >
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-[13px] font-semibold text-ink">Client input</h3>
          </div>
        <FieldRow
          label="Problem statement and context"
          hint="Everything the client gave you: meeting transcripts, emails, requirements."
          chip={<InternalChip />}
          state={stateFor("customProblemStatement")}
        >
          <TextField
            initialValue={quote.customProblemStatement}
            disabled={!canEdit}
            multiline
            rows={8}
            placeholder="Paste meeting transcripts, emails, requirements…"
            onSave={(v) =>
              patchAndRefresh("customProblemStatement", { customProblemStatement: v })
            }
          />
        </FieldRow>

        <FieldRow
          label="Client documents"
          hint="Requirements, screenshots, anything the AI should read."
          chip={<InternalChip />}
        >
          <QuoteAttachments
            quoteId={quoteId}
            attachments={quote.documents}
            setAttachments={(next) => setQuote({ ...quote, documents: next })}
            canEdit={canEdit}
          />
        </FieldRow>

        <CreateAiProposalRow
          canEdit={canEdit}
          hasClientInput={
            asStr(quote.customProblemStatement).trim().length > 0 || quote.documents.length > 0
          }
          aiContentReady={
            asStr(quote.recommendedApproach).trim().length > 0 &&
            asStr(quote.recommendedApproachSummary).trim().length > 0 &&
            asStr(quote.projectOverview).trim().length > 0 &&
            asStr(quote.problemStatementSolution).trim().length > 0 &&
            asStr(quote.estimateCostRange).trim().length > 0 &&
            quote.stories.length > 0
          }

          isAgentRunning={isAgentRunning}
          isTriggering={aiTriggering}
          pollStartedAt={pollStartedAt}
          pollTick={pollTick}
          error={aiError}
          onClick={handleTriggerAi}
        />

          <div className="px-4 pt-4 pb-1 border-t border-rule flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-ink">Generated proposal</h3>
            <PortalChip />
            <span className="text-[12px] text-ink-muted">Written by the AI agent. Edit only to override it.</span>
          </div>

        <FieldRow label="Recommended approach" chip={<PortalChip />} state={stateFor("recommendedApproach")}>
          <AiField
            value={quote.recommendedApproach}
            canEdit={canEdit}
            rows={5}
            onSave={(v) => patchAndRefresh("recommendedApproach", { recommendedApproach: v })}
          />
        </FieldRow>

        <FieldRow
          label="Approach summary"
          chip={<PortalChip />}
          state={stateFor("recommendedApproachSummary")}
        >
          <AiField
            value={quote.recommendedApproachSummary}
            canEdit={canEdit}
            rows={3}
            onSave={(v) =>
              patchAndRefresh("recommendedApproachSummary", { recommendedApproachSummary: v })
            }
          />
        </FieldRow>

        <FieldRow label="Project overview" chip={<PortalChip />} state={stateFor("projectOverview")}>
          <AiField
            value={quote.projectOverview}
            canEdit={canEdit}
            rows={5}
            onSave={(v) => patchAndRefresh("projectOverview", { projectOverview: v })}
          />
        </FieldRow>

        <FieldRow
          label="Problem and our solution"
          chip={<PortalChip />}
          state={stateFor("problemStatementSolution")}
        >
          <AiField
            value={quote.problemStatementSolution}
            canEdit={canEdit}
            rows={5}
            onSave={(v) =>
              patchAndRefresh("problemStatementSolution", { problemStatementSolution: v })
            }
          />
        </FieldRow>

        <FieldRow label="Cost estimate" chip={<PortalChip />} state="idle">
          <div className="px-2 py-1.5 text-[13px] text-ink whitespace-pre-wrap">
            {asStr(quote.estimateCostRange).trim() || "—"}
          </div>
        </FieldRow>
        </StageSection>
      )}

      <StageSection
        id="scope"
        title={isRetainer ? "Monthly stories" : "Scope & delivery"}
        summary={scopeSummary}
        state={scopeState}
        defaultOpen
        storageKey={k("scope")}
        actions={isRetainer ? undefined : addButton("Add story", () => setShowAddStory(true))}
      >
        <div>
          <QuoteStoriesTable
            stories={originalStories}
            totalCost={quote.originalTotalCost}
            totalHours={quote.originalTotalHours}
            canEdit={canEdit}
            onAddClick={() => setShowAddStory(true)}
            onRowClick={openStory}
            title={isRetainer ? "Hours this period" : "Original scope total"}
            addLabel="+ Add story"
            quoteId={quote.id}
            people={people}
            onReordered={(next) => setQuote(next)}
            onChanged={(next) => setQuote(next)}
            groupByMonth={quote.proposalType === "Retainer Agreement"}
            bare
          />

          {storyLoading && (
            <div className="px-4 py-2 text-[12px] text-ink-faint">Loading story…</div>
          )}
        </div>
      </StageSection>

      {!isRetainer && (
        <StageSection
          id="change-orders"
          title="Change orders"
          summary={coSummary}
          defaultOpen={changeOrderStories.length > 0}
          storageKey={k("change-orders")}
          actions={addButton("Add change order story", () => setShowAddChangeOrder(true))}
        >
        <FieldRow
          label="Change order context"
          hint="Meeting notes, scope changes, client requests. The AI drafts the summary and stories from this."
          state={stateFor("changeOrderInputDetails")}
        >
          <CollapsibleFieldWrapper
            storageKey={`quote:${quote.id}:co-input-open`}
            title="Change order context"
            initialContent={quote.changeOrderInputDetails}
            emptyHint="Empty — click to add context"
          >
            <TextField
              initialValue={quote.changeOrderInputDetails}
              disabled={!canEdit}
              multiline
              rows={8}
              placeholder="Paste change order context for the AI agent here…"
              onSave={(v) =>
                patchAndRefresh("changeOrderInputDetails", { changeOrderInputDetails: v })
              }
            />
            <CreateAiChangeOrderRow
              canEdit={canEdit}
              hasInput={quote.changeOrderInputDetails.trim().length > 0}
              aiContentReady={quote.changeOrderDetails.trim().length > 0}
              isAgentRunning={isCoAgentRunning}
              isTriggering={coAiTriggering}
              pollStartedAt={coPollStartedAt}
              pollTick={coPollTick}
              error={coAiError}
              onClick={handleTriggerCoAi}
            />
          </CollapsibleFieldWrapper>
        </FieldRow>

        <FieldRow
          label="Change order summary"
          hint="Scope, reason and timing for all change orders. Drafted by the AI from the context above."
          chip={<PortalChip />}
          state={stateFor("changeOrderDetails")}
        >
          <TextField
            initialValue={quote.changeOrderDetails}
            disabled={!canEdit}
            multiline
            rows={6}
            placeholder="Describe the change orders for this engagement…"
            onSave={(v) =>
              patchAndRefresh("changeOrderDetails", { changeOrderDetails: v })
            }
          />
        </FieldRow>

        <FieldRow label="Change order estimate" chip={<PortalChip />} state="idle">
          <div className="px-2 py-1.5 text-[13px] text-ink whitespace-pre-wrap">
            {asStr(quote.changeOrderEstimateCost).trim() || "—"}
          </div>
        </FieldRow>


        <div>
          <QuoteStoriesTable
            stories={changeOrderStories}
            totalCost={quote.changeOrderTotalCost}
            totalHours={quote.changeOrderTotalHours}
            canEdit={canEdit}
            onAddClick={() => setShowAddChangeOrder(true)}
            onRowClick={openStory}
            title="Change order total"
            addLabel="+ Add change order story"
            emptyLabel={
              canEdit
                ? "No change orders yet. Click + Add change order story to log one."
                : "No change orders yet."
            }
            quoteId={quote.id}
            people={people}
            onReordered={(next) => setQuote(next)}
            onChanged={(next) => setQuote(next)}
            bare
          />


          {/* Grand total */}
          <div className="m-4 flex items-center justify-between gap-3 px-3 py-3 border border-rule rounded-md bg-bg-elevated">
            <div className="text-[12px] text-ink-muted">Total with change orders</div>
            <div className="flex items-baseline gap-3">
              <div className="text-[20px] font-semibold text-ink-strong tabnum leading-none">
                {fmtUsd(quote.originalTotalCost + quote.changeOrderTotalCost)}
              </div>
              {(quote.originalTotalHours != null || quote.changeOrderTotalHours != null) && (
                <div className="text-[12px] text-ink-muted tabnum">
                  {((quote.originalTotalHours ?? 0) + (quote.changeOrderTotalHours ?? 0))}h
                </div>
              )}
            </div>
          </div>
        </div>
        </StageSection>
      )}

      {afterScope}

      {pageMode && detailsSection}

      <NewQuoteStoryModal
        open={showAddStory}
        quoteId={quoteId}
        onClose={() => setShowAddStory(false)}
        onCreated={(next) => setQuote(next)}
        people={people}
        isRetainer={quote.proposalType === "Retainer Agreement"}
      />


      <NewQuoteStoryModal
        open={showAddChangeOrder}
        quoteId={quoteId}
        onClose={() => setShowAddChangeOrder(false)}
        onCreated={(next) => setQuote(next)}
        people={people}
        isChangeOrder
      />

      {selectedStory && (
        <DrawerErrorBoundary
          airtableUrl={selectedStory.airtableUrl}
          onClose={closeStory}
          label="This story"
        >
          <StorySheet
            story={selectedStory}
            engineers={people.filter((p) => p.isInternal && p.isActive).map((p) => ({ id: p.id, name: p.name }))}
            sprints={sprints}
            canEdit={canEdit}
            onClose={closeStory}
            onDeleted={() => {
              loadQuoteDetail(quoteId).then((res) => {
                if ("ok" in res) setQuote(res.quote);
              });
            }}
            onFilterByEngineer={() => {}}
            onFilterByClient={() => {}}
          />
        </DrawerErrorBoundary>
      )}
    </>
  );
}
