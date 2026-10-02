"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type ComboOption = {
  value: string;
  label: string;
  /** Optional colour swatch shown before the label (CSS colour). */
  color?: string;
};

/**
 * The app's dropdown: a button that opens a filterable list. Type to narrow,
 * ↑ ↓ to move, Enter to pick, Esc to close. Follows the WAI-ARIA combobox
 * pattern so it works from the keyboard and with screen readers.
 */
export function Combobox({
  value,
  options,
  onChange,
  label,
  placeholder = "Select…",
  prefix,
  searchable,
  disabled,
  className = "",
  buttonClassName = "",
  menuMinWidth = 220,
}: {
  value: string | null;
  options: ComboOption[];
  onChange: (value: string) => void;
  /** Accessible name, e.g. "Client". */
  label: string;
  placeholder?: string;
  /** Muted text inside the button before the value, e.g. "Deal stage". */
  prefix?: string;
  /** Show the type-to-filter input. Defaults to on for more than 7 options. */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuMinWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const canSearch = searchable ?? options.length > 7;

  const selected = options.find((o) => o.value === value) ?? null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Open on the current value; focus the search box or the list.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    requestAnimationFrame(() => (canSearch ? inputRef.current : listRef.current)?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const pick = (o: ComboOption) => {
    if (o.value !== value) onChange(o.value);
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(shown.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) pick(shown[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    } else if (!canSearch && e.key.length === 1) {
      // Type-ahead when there's no search box: jump to the next match.
      const k = e.key.toLowerCase();
      const start = active + 1;
      const order = [...shown.slice(start), ...shown.slice(0, start)];
      const hit = order.find((o) => o.label.toLowerCase().startsWith(k));
      if (hit) setActive(shown.indexOf(hit));
    }
  };

  const activeId = shown[active] ? `${id}-opt-${active}` : undefined;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `${label}: ${selected.label}` : label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`w-full inline-flex items-center gap-2 px-2.5 py-1.5 text-[12.5px] bg-surface border border-rule rounded-md text-left transition-colors hover:border-rule-strong focus-visible:outline-none focus-visible:border-emerald disabled:opacity-60 disabled:cursor-default ${
          open ? "border-emerald" : ""
        } ${buttonClassName}`}
      >
        {prefix && <span className="text-ink-muted shrink-0">{prefix}</span>}
        {selected?.color && <Swatch color={selected.color} />}
        <span className={`flex-1 min-w-0 truncate ${selected ? "text-ink-strong" : "text-ink-muted"}`}>
          {selected?.label ?? placeholder}
        </span>
        {!disabled && (
          <ChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 z-40 mt-1 w-full bg-surface border border-rule-strong rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
          style={{ minWidth: menuMinWidth }}
        >
          {canSearch && (
            <div className="relative border-b border-rule">
              <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label={`Search ${label.toLowerCase()}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Type to search…"
                className="w-full bg-transparent pl-8 pr-2.5 py-2 text-[12.5px] text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={canSearch ? undefined : -1}
            aria-activedescendant={canSearch ? undefined : activeId}
            onKeyDown={canSearch ? undefined : onKey}
            className="max-h-72 overflow-y-auto py-1 focus:outline-none"
          >
            {shown.length === 0 && <li className="px-3 py-2 text-[12.5px] text-ink-muted">No matches</li>}
            {shown.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-[12.5px] cursor-pointer ${
                    i === active ? "bg-bg-elevated text-ink-strong" : "text-ink"
                  }`}
                >
                  {o.color && <Swatch color={o.color} />}
                  <span className="flex-1 min-w-0 truncate">{o.label}</span>
                  {isSel && <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}
