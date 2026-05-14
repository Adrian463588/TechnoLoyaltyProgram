/**
 * Backend/src/errors/not-found-error.ts
 *
 * Thrown when a requested resource does not exist in the database.
 * Returns HTTP 404 with a descriptive message.
 */

import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}
