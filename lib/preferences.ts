// Server-only read of the signed-in person's UI preferences (People.Preferences).
import "server-only";

import { listRecordsCached } from "./airtable";
import { Tables } from "./schema";
import { getAppSession } from "./session";
import { resolvePersonByEmail } from "./people";
import { parsePreferences, type Preferences } from "./preferences-types";

const PEOPLE = Tables.People;

/** {} when signed out, unmatched to a People row, or nothing saved yet. */
export async function getMyPreferences(): Promise<Preferences> {
  const session = await getAppSession();
  const person = await resolvePersonByEmail(session?.user?.email);
  if (!person) return {};
  try {
    // Cached; any write to People (including saving a preference) clears it.
    const rows = await listRecordsCached<Record<string, unknown>>(
      PEOPLE.id,
      {
        fields: [PEOPLE.fields["Preferences"].id],
        filterByFormula: `RECORD_ID() = "${person.id}"`,
        returnFieldsByFieldId: true,
      },
      [`people:prefs:${person.id}`],
    );
    return parsePreferences(rows[0]?.fields[PEOPLE.fields["Preferences"].id]);
  } catch {
    return {};
  }
}
