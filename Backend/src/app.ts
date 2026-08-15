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
import chatbotRoutes      from "./api/chatbot.routes";
import { errorHandler }   from "./middleware/error-handler";
import { metricsMiddleware, metricsHandler } from "./middleware/metrics";
import { prisma }         from "./db/prisma";
import { redisClient }    from "./utils/cache/redis-client";
import path from "path";
import { loadEnvironment } from "./config/env";

const app: Application = express();
const environment = loadEnvironment();

// ── Static Files ──────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Global middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = environment.FRONTEND_ORIGIN.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server) 
      // or if the origin is explicitly in our allowed list, or ends with our dynamic deployment domains.
      const isAllowed = !origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith(".sslip.io") || 
        origin.endsWith(".nip.io");

      if (isAllowed) {
        callback(null, true);
      } else {
        // Use callback(null, false) instead of throwing an Error to prevent 500 Internal Server Errors
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Security headers ──────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options",        "DENY");
  res.setHeader("X-XSS-Protection",       "1; mode=block");
  res.setHeader("Referrer-Policy",        "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy",     "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  if (environment.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// ── Prometheus Metrics ───────────────────────────────────────────────────
app.use(metricsMiddleware);
app.get("/metrics", metricsHandler);

// ── Health & Root checks ──────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    service: "Techno Loyalty Program API",
    status: "online",
    docs: "/api-docs",
    health: "/health"
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
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
app.use("/api/chatbot",  chatbotRoutes);

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
const PORT = environment.PORT;

async function bootstrap() {
  // Connect Redis only if enabled in env; gracefully skips if not configured.
  await redisClient.connect();

  const server = app.listen(PORT, () => {
    console.warn(
      `[Backend] Server running on port ${String(PORT)} — env: ${environment.NODE_ENV}`
    );
  });

  function shutdown(signal: string): void {
    console.warn(`[Backend] ${signal} received — shutting down gracefully`);
    server.close(() => {
      Promise.allSettled([
        prisma.$disconnect(),
        redisClient.disconnect(),
      ]).then(() => {
        process.exit(0);
      }).catch((err: unknown) => {
        console.error("Error during shutdown", err);
        process.exit(1);
      });
    });
  }

  process.on("SIGTERM", () => { shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { shutdown("SIGINT"); });
}

void bootstrap();

export default app;
