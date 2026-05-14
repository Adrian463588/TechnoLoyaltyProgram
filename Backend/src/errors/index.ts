/**
 * Backend/src/errors/index.ts
 *
 * Barrel export for all custom error classes.
 * Import from "@/errors" throughout the Backend.
 */

export { AppError } from "./app-error";
export { ValidationError } from "./validation-error";
export { NotFoundError } from "./not-found-error";
export { UnauthorizedError } from "./unauthorized-error";
export { ForbiddenError } from "./forbidden-error";
export { DomainError } from "./domain.error";
