/**
 * Backend/src/api/auth.routes.ts
 *
 * Auth routes are handled by NextAuth on the Frontend.
 * This file exposes a token validation endpoint for Backend-side verification.
 */

import { Router } from "express";
import { authenticate }  from "@/middleware/authenticate";

export const authRoutes: Router = Router();

// ── Verify session ─────────────────────────────────────────────────────────
// Frontend calls this to confirm a token is valid against Backend
authRoutes.get("/verify", authenticate, (req, res) => {
  const { user } = req as typeof req & { user: { id: string; role: string } };
  res.json({ valid: true, userId: user.id, role: user.role });
});
