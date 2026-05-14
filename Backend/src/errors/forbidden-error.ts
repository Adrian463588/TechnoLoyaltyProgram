/**
 * Backend/src/errors/forbidden-error.ts
 *
 * Thrown when an authenticated user does not have permission
 * to access a resource. Returns HTTP 403.
 */

import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied — insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}
