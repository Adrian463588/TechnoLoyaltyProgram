/**
 * Backend/src/types/api.types.ts
 *
 * API-layer TypeScript types — request extensions, response envelopes, and role definitions.
 * Do NOT import from @prisma/client here; keep this layer decoupled.
 */

import type { Request } from "express";

// ── Role definitions ───────────────────────────────────────────────────────

export type UserRole = "MITRA" | "TEAM_LEADER" | "HC_PM";

export interface SessionUser {
  id:          string;
  npk:         string;
  name:        string;
  email:       string;
  role:        UserRole;
  divisionId?: string;
}

// ── Authenticated request extension ───────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

// ── Standard API response envelopes ───────────────────────────────────────

export interface ApiSuccess<T> {
  data:    T;
  message?: string;
}

export interface ApiError {
  error:   string;
  code?:   string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page:    number;
  limit:   number;
}

export interface PaginatedResult<T> {
  items:      T[];
  total:      number;
  page:       number;
  totalPages: number;
}
