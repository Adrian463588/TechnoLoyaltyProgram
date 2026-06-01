/**
 * Backend/src/middleware/metrics.ts
 * Exposes Prometheus metrics endpoint at /metrics.
 * Uses prom-client default registry with default Node.js metrics collected.
 */

import { collectDefaultMetrics, Registry, Counter, Histogram } from "prom-client";
import type { Request, Response, NextFunction } from "express";

// ── Registry ────────────────────────────────────────────────────────────────
const register = new Registry();
register.setDefaultLabels({ app: "loyalty-backend" });
collectDefaultMetrics({ register });

// ── HTTP Request Counter ─────────────────────────────────────────────────────
export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

// ── HTTP Request Duration Histogram ─────────────────────────────────────────
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// ── Request Timing Middleware ────────────────────────────────────────────────
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path ?? req.path;
    const status = String(res.statusCode);
    httpRequestCounter.labels(req.method, route, status).inc();
    httpRequestDuration.labels(req.method, route, status).observe(duration);
  });
  next();
}

// ── Metrics Endpoint Handler ────────────────────────────────────────────────
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}
