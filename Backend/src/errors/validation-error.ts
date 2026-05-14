/**
 * Backend/src/errors/validation-error.ts
 *
 * Thrown when incoming request data fails Zod or manual validation.
 * Returns HTTP 400 with structured details.
 */

import { AppError } from "./app-error";

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}
