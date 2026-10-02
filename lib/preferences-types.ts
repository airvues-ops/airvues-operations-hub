// Client-safe: the per-person UI preferences the app knows how to store.
// Stored as JSON in People.Preferences. Only keys listed here are accepted,
// each with its allowed values, so a client can't write arbitrary data.

export const PREFERENCE_VALUES = {
  "projects.view": ["list", "table"],
} as const;

export type PreferenceKey = keyof typeof PREFERENCE_VALUES;
export type Preferences = {
  [K in PreferenceKey]?: (typeof PREFERENCE_VALUES)[K][number];
};

/** Parse stored JSON, keeping only known keys with allowed values. */
export function parsePreferences(raw: unknown): Preferences {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, allowed] of Object.entries(PREFERENCE_VALUES)) {
      const v = obj?.[k];
      if (typeof v === "string" && (allowed as readonly string[]).includes(v)) out[k] = v;
    }
    return out as Preferences;
  } catch {
    return {};
  }
}
