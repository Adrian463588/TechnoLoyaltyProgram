/**
 * Backend/src/api/auth.routes.ts
 *
 * Login endpoint — used by the Frontend NextAuth Credentials provider.
 * Token verification endpoint — used by Backend middleware pre-check.
 *
 * SOLID — SRP: only handles auth HTTP concerns.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }  from "@/middleware/authenticate";
import { prisma }        from "@/db/prisma";
import bcrypt            from "bcryptjs";
import { z }             from "zod";
import { loginSchema }   from "@/types/validations";

export const authRoutes = Router();

// ── Login ──────────────────────────────────────────────────────────────────
authRoutes.post("/login", (async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:   "Invalid input",
      details: parsed.error.format(),
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id:             true,
        name:           true,
        email:          true,
        division:       true,
        role:           true,
        partnerStatus:  true,
        passwordHash:   true,
      },
    });

    if (!user || user.partnerStatus === "RESIGNED") {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    res.json({
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        division:   user.division,
      },
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}) as RequestHandler);

// ── Verify session token ───────────────────────────────────────────────────
authRoutes.get("/verify", authenticate, ((req, res) => {
  res.json({ valid: true, userId: req.user.id, role: req.user.role });
}) satisfies RequestHandler);
