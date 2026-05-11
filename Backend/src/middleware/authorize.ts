/**
 * Backend/src/middleware/authorize.ts
 *
 * Role-based authorization middleware factory.
 * Returns a RequestHandler that checks if the authenticated user has the required role.
 *
 * SOLID — OCP: add new roles without changing existing middleware.
 * SOLID — SRP: only checks authorization, not authentication.
 */

import type { RequestHandler } from "express";
import type { AuthenticatedRequest, UserRole } from "@/types/api.types";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  MITRA:       1,
  TEAM_LEADER: 2,
  HC_PM:       3,
};

/**
 * Returns middleware that allows access only if the user's role level
 * is greater than or equal to the minimum required role.
 */
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const authReq  = req as AuthenticatedRequest;
    const userRole = authReq.user?.role as UserRole | undefined;

    if (!userRole) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userLevel     = ROLE_HIERARCHY[userRole] ?? 0;
    const hasAccess     = allowedRoles.some(
      (role) => ROLE_HIERARCHY[role] <= userLevel
    );

    if (!hasAccess) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
}
