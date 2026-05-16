export const CacheErrors = {
  CACHE001: "Redis/Memurai connection failed",
  CACHE002: "Redis/Memurai operation timeout",
  CACHE003: "Cache operation failed",
  CACHE004: "Invalid cache key pattern",
  CACHE005: "Batch delete size exceeded",
  CACHE006: "Cache serialization failed",
  CACHE007: "Cache invalidation failed",
  CACHE008: "Cache disabled by configuration",
} as const;

export type CacheErrorCode = keyof typeof CacheErrors;

export class CacheError extends Error {
  constructor(public code: CacheErrorCode, message?: string) {
    super(`${code}: ${CacheErrors[code]}${message ? ` - ${message}` : ""}`);
    this.name = "CacheError";
  }
}
