import { AppError } from "./app-error";

export class DomainError extends AppError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message, 422, code);
    this.name = "DomainError";
  }
}
