/**
 * Backend/src/errors/conflict-error.ts
 *
 * Thrown when an operation conflicts with existing state (HTTP 409).
 */

import { AppError } from "./app-error";

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(message, 409, code);
  }
}
