/**
 * Backend/src/middleware/error-handler.ts
 *
 * Centralized error handler. Must be registered LAST in Express middleware chain.
 * Differentiates custom AppError subtypes and returns structured JSON.
 */

import type { ErrorRequestHandler } from "express";
import { AppError, ValidationError, NotFoundError } from "@/errors";

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next): void => {
  const isDev = process.env.NODE_ENV !== "production";

  // ── Known error types ───────────────────────────────────────
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // ── Unknown / unexpected error ──────────────────────────────
  const errorInstance = err instanceof Error ? err : new Error(String(err));
  console.error(
    "[ErrorHandler] Unhandled error:",
    isDev ? errorInstance.stack : errorInstance.message,
  );

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(isDev && { stack: errorInstance.stack }),
  });
};
