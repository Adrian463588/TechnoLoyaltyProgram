/**
 * Backend/src/app.ts
 *
 * Express application entry point.
 * Thin orchestration layer — all business logic lives in services.
 *
 * SOLID: Single entry point only wires routes and middleware.
 * Clean Code: Each concern is registered once, in order.
 */

import "dotenv/config"; // Load .env before Prisma initializes
import express, { type Application } from "express";
import cors from "cors";

import { authRoutes }     from "./api/auth.routes";
import { employeeRoutes } from "./api/employee.routes";
import { adminRoutes }    from "./api/admin.routes";
import { leaderRoutes }   from "./api/leader.routes";
import { errorHandler }   from "./middleware/error-handler";
import swaggerUi          from "swagger-ui-express";
import { swaggerSpec }    from "./utils/swagger";

const app: Application = express();

// ── Swagger Documentation ──────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Global middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin:      process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: true,
    methods:     ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Security headers ──────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options",        "DENY");
  res.setHeader("X-XSS-Protection",       "1; mode=block");
  res.setHeader("Referrer-Policy",        "strict-origin-when-cross-origin");
  next();
});

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/leader",   leaderRoutes);

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  console.warn(`[Backend] Server running on port ${String(PORT)} — env: ${process.env.NODE_ENV ?? "development"}`);
});

export default app;
