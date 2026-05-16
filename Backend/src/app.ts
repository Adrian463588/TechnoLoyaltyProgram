/**
 * Backend/src/app.ts — Express entry point.
 * Thin orchestration: wires routes, middleware, lifecycle hooks.
 */

import "dotenv/config";
import express, { type Application } from "express";
import cors from "cors";

import { authRoutes }     from "./api/auth.routes";
import { employeeRoutes } from "./api/employee.routes";
import { adminRoutes }    from "./api/admin.routes";
import { leaderRoutes }   from "./api/leader.routes";
import { errorHandler }   from "./middleware/error-handler";
import { prisma }         from "./db/prisma";
import { redisClient }    from "./utils/cache/redis-client";

const app: Application = express();

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

// ── Swagger — lazy-loaded, only initialises AST on first hit ─────────────
app.get("/api-docs", async (req, res) => {
  const [swaggerUi, { swaggerSpec }] = await Promise.all([
    import("swagger-ui-express"),
    import("./utils/swagger"),
  ]);
  const html = swaggerUi.default.generateHTML(swaggerSpec);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});


// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/leader",   leaderRoutes);

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 8080);

async function bootstrap() {
  // Connect Redis only if enabled in env; gracefully skips if not configured.
  await redisClient.connect();

  const server = app.listen(PORT, () => {
    console.warn(
      `[Backend] Server running on port ${String(PORT)} — env: ${process.env.NODE_ENV ?? "development"}`
    );
  });

  // ── Graceful shutdown — prevents orphaned DB/Redis connections ───────────
  async function shutdown(signal: string) {
    console.warn(`[Backend] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await Promise.allSettled([
        prisma.$disconnect(),
        redisClient.disconnect(),
      ]);
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });
}

void bootstrap();

export default app;
