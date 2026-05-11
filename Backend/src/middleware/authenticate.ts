/**
 * Backend/src/middleware/authenticate.ts
 *
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token, attaches user to request.
 *
 * SOLID — SRP: only verifies identity, does NOT check roles.
 */

import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@/types/api.types";

export const authenticate: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // TODO: verify JWT with NextAuth secret — for now forward to NextAuth session API
    // In a full split, Backend would verify the JWT independently using jose or jsonwebtoken
    // with the shared NEXTAUTH_SECRET.
    const sessionRes = await fetch(`${process.env.FRONTEND_ORIGIN}/api/auth/session`, {
      headers: { Cookie: `next-auth.session-token=${token}` },
    });

    if (!sessionRes.ok) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await sessionRes.json() as { user?: { id: string; role: string; npk: string } };

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    (req as AuthenticatedRequest).user = session.user;
    next();
  } catch {
    res.status(401).json({ error: "Authentication failed" });
  }
};
