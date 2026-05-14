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

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate a user and return user data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - npk
 *               - password
 *             properties:
 *               npk:
 *                 type: string
 *                 example: "12345"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     npk:
 *                       type: string
 *                     role:
 *                       type: string
 *                     division:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
authRoutes.post("/login", (async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:   "Invalid input",
      details: parsed.error.format(),
    });
    return;
  }

  const { npk, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { npk },
      select: {
        id:             true,
        name:           true,
        email:          true,
        npk:            true,
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
        npk:        user.npk,
        role:       user.role,
        division:   user.division,
      },
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}) as RequestHandler);

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify the current session token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized or invalid token
 */
authRoutes.get("/verify", authenticate, ((req, res) => {
  res.json({ valid: true, userId: req.user.id, role: req.user.role });
}) satisfies RequestHandler);
