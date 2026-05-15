/**
 * Server-Side Auth Guard
 *
 * Use this in every API route handler to enforce role-based access.
 *
 * Usage:
 *   const sessionOrError = await requireRole("HC_PM");
 *   if (sessionOrError instanceof NextResponse) return sessionOrError;
 *   const actorId = getActorId(sessionOrError);
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

type Role = "MITRA" | "TEAM_LEADER" | "HC_PM";

const ROLE_HIERARCHY: Record<Role, number> = {
  MITRA:        1,
  TEAM_LEADER:  2,
  HC_PM:        3,
};

/**
 * Validates session and checks the caller has at least one of the required roles.
 * Returns the session on success, or a NextResponse (401/403) on failure.
 */
export async function requireRole(
  ...allowedRoles: Role[]
): Promise<Session | NextResponse> {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required." },
      { status: 401 },
    );
  }

  const userRole = (session.user as { role?: string }).role as Role | undefined;

  if (!userRole) {
    return NextResponse.json(
      { error: "Forbidden", message: "No role assigned to this account." },
      { status: 403 },
    );
  }

  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const hasPermission = allowedRoles.some(
    (r) => ROLE_HIERARCHY[r] <= userLevel,
  );

  if (!hasPermission) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Access requires one of: ${allowedRoles.join(", ")}. Your role: ${userRole}.`,
      },
      { status: 403 },
    );
  }

  return session;
}

/**
 * Extracts actor ID from session. Call after requireRole confirms auth.
 */
export function getActorId(session: Session): string {
  return session?.user?.id ?? "SYSTEM";
}
