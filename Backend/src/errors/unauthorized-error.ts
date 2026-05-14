/**
 * Backend/src/errors/unauthorized-error.ts
 *
 * Thrown when a request is missing valid authentication credentials.
 * Returns HTTP 401.
 */

import { AppError } from "./app-error";

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized — valid credentials required") {
    super(message, 401, "UNAUTHORIZED");
  }
}
