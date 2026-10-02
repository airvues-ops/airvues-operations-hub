"use server";

// Saves one UI preference for the signed-in person into People.Preferences.
// Only the caller's own row, only keys/values listed in preferences-types.

import { getRecord, patchRecords } from "../airtable";
import { Tables } from "../schema";
import { AuthzError, requireSignedIn } from "../authz";
import { resolvePersonByEmail } from "../people";
import {
  PREFERENCE_VALUES,
  parsePreferences,
  type PreferenceKey,
} from "../preferences-types";

const PEOPLE = Tables.People;

export async function setMyPreference<K extends PreferenceKey>(
  key: K,
  value: (typeof PREFERENCE_VALUES)[K][number],
): Promise<{ ok: true } | { error: string }> {
  let email: string;
  try {
    email = (await requireSignedIn()).user.email;
  } catch (e) {
    if (e instanceof AuthzError) return { error: "Your session has ended. Sign in again." };
    throw e;
  }
  const allowed = PREFERENCE_VALUES[key] as readonly string[] | undefined;
  if (!allowed || !allowed.includes(value)) return { error: "Unknown preference" };

  const person = await resolvePersonByEmail(email);
  if (!person) return { error: "No People record matches your sign-in email, so this can't be saved." };

  try {
    // Read fresh, not cached: merging into stale JSON would drop a preference
    // saved moments ago from another tab.
    const rec = await getRecord<Record<string, unknown>>(PEOPLE.id, person.id);
    const current = parsePreferences(rec.fields["Preferences"]);
    if (current[key] === value) return { ok: true };
    const next = { ...current, [key]: value };
    await patchRecords(PEOPLE.id, [
      { id: person.id, fields: { [PEOPLE.fields["Preferences"].id]: JSON.stringify(next) } },
    ]);
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
