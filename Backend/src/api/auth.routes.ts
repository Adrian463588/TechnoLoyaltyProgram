/**
 * Backend/src/api/auth.routes.ts
 *
 * Login endpoint — used by the Frontend NextAuth Credentials provider.
 * Token verification endpoint — used by Backend middleware pre-check.
 *
 * SOLID — SRP: only handles auth HTTP concerns.
 * AGENTS.md: Thin route — no DB or business logic here.
 */

import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { authenticate }  from "@/middleware/authenticate";
import { loginSchema }   from "@/types/validations";
import { authService }   from "@/services/auth.service";
import { ValidationError } from "@/errors/index";

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
 *                 example: "<environment-managed-secret>"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRoutes.post("/login", (async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:   "Invalid input",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  try {
    const user = await authService.login(parsed.data.npk, parsed.data.password);
    res.json({ user });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
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
