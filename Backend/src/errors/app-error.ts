/**
 * Backend/src/errors/app-error.ts
 *
 * Abstract base class for all application-level errors.
 * Provides consistent statusCode and machine-readable code
 * for use by the error-handler middleware.
 *
 * SOLID — LSP: all subclasses are substitutable for AppError.
 */

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
