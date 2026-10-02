// Server-side authorization gate.
// Pattern: call requireRole("admin", "lead") at the top of every Server Action that mutates.
// Today (shared password) every signed-in user has role=admin so the gate passes.
// After Google OAuth + ALLOWED_USERS lands, roles per email become real.
import "server-only";

import { AppSession, getAppSession } from "./session";
import { canRoleDelete } from "./permissions";
import type { AppRole } from "./auth";
import { createRecords } from "./airtable";
import { Tables } from "./schema";

export class AuthzError extends Error {
  constructor(
    public reason: "unauthenticated" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

export async function requireRole(
  ...allowed: AppRole[]
): Promise<NonNullable<AppSession>> {
  const session = await getAppSession();
  if (!session?.user) {
    throw new AuthzError("unauthenticated", "Not signed in");
  }
  if (!allowed.includes(session.user.role)) {
    throw new AuthzError(
      "forbidden",
      `Role ${session.user.role} not in allowed: ${allowed.join(", ")}`,
    );
  }
  return session;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const session = await getAppSession();
  return session?.user.role ?? null;
}

// Edit rights are no longer gated by role. Any signed-in user can mutate;
// what each user can see/reach is controlled by Airtable People.Permissions
// (see lib/permissions.ts + lib/page-guard.ts).
export async function canMutate(): Promise<boolean> {
  const session = await getAppSession();
  return !!session?.user;
}

// ---------------------------------------------------------------------------
// Deleting is open to any signed-in user, like every other write. What makes it
// safe is traceability: every delete/archive/restore calls logDeletion() after
// it succeeds, which writes who did it to the Project Log in Airtable.
export async function canDelete(): Promise<boolean> {
  const session = await getAppSession();
  return canRoleDelete(session?.user.role);
}

/**
 * Gate for every delete/archive Server Action.
 *
 * Returns a ready-to-surface `{ error }` instead of throwing, because that is
 * the shape every mutation in lib/mutations already returns to the client.
 */
export async function deleteGate(): Promise<{ error: string } | null> {
  const session = await getAppSession();
  if (!session?.user) return { error: "Your session has ended. Sign in again." };
  return null;
}

/**
 * Audit trail for deletes. Writes one Project Log row naming the signed-in
 * user, plus a console line so it also shows in Vercel logs. Call it after the
 * delete succeeded. Never throws — a failed log must not undo a done delete.
 *
 * Event Type "Record deleted" is a new select option; createRecords runs with
 * typecast, so the first write adds it to the Project Log table.
 */
export async function logDeletion(args: {
  /** e.g. 'Deleted story "Fix login"' or 'Archived company "Acme"'. */
  what: string;
  projectId?: string | null;
  accountId?: string | null;
}): Promise<void> {
  const session = await getAppSession();
  const u = session?.user;
  const who = u ? (u.name ? `${u.name} <${u.email}>` : u.email) : "unknown user";
  const detail = `${args.what} — by ${who}`;
  console.info("[audit] delete", detail);
  const fields: Record<string, unknown> = {
    "Event Type": "Record deleted",
    Timestamp: new Date().toISOString(),
    Detail: detail,
  };
  if (args.projectId) fields["Project"] = [args.projectId];
  if (args.accountId) fields["Account"] = [args.accountId];
  try {
    await createRecords(Tables.ProjectLog.id, [{ fields }]);
  } catch (e) {
    console.error("[audit] failed to write Project Log row", (e as Error).message);
  }
}

// Server-Action / route-handler gate: throws AuthzError if there is no session.
// Use this at the top of every mutation instead of requireRole(...).
export async function requireSignedIn(): Promise<NonNullable<AppSession>> {
  const session = await getAppSession();
  if (!session?.user) {
    throw new AuthzError("unauthenticated", "Not signed in");
  }
  return session;
}
