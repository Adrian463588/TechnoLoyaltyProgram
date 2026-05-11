/**
 * Backend/src/middleware/error-handler.ts
 *
 * Centralized Express error handler.
 * All uncaught errors bubble here — never expose internal stack in production.
 *
 * Clean Code: single place to format all error responses.
 */

import type { ErrorRequestHandler } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?:       string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err: AppError, _req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const isDev      = process.env.NODE_ENV === "development";

  console.error(`[ErrorHandler] ${err.message}`, isDev ? err.stack : "");

  res.status(statusCode).json({
    error:   err.message ?? "Internal server error",
    code:    err.code,
    ...(isDev && { stack: err.stack }),
  });
};
