/**
 * Frontend/src/lib/api-client/index.ts
 *
 * Type-safe HTTP client for communicating with the Backend REST API.
 * All data fetching from the Frontend MUST go through this layer.
 *
 * SOLID — DIP: Frontend depends on this abstraction, not on DB/Prisma directly.
 * DRY: one fetch helper, one error-handling pattern, reused everywhere.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";

// ── Base fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const url      = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ── Auth helper ─────────────────────────────────────────────────────────────

function withAuth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ── Employee API ───────────────────────────────────────────────────────────

export const employeeApi = {
  getDashboard: (token: string) =>
    apiFetch<EmployeeDashboardResponse>("/api/employee/dashboard", {
      headers: withAuth(token),
      next:    { revalidate: 60 },
    } as RequestInit),

  getTokenSummary: (token: string) =>
    apiFetch<TokenSummaryResponse>("/api/employee/token-summary", {
      headers: withAuth(token),
    }),

  getMyRedemptions: (token: string) =>
    apiFetch<RedemptionResponse[]>("/api/employee/redemptions", {
      headers: withAuth(token),
    }),

  createRedemption: (token: string, rewardItemId: string) =>
    apiFetch<RedemptionResponse>("/api/employee/redemptions", {
      method:  "POST",
      headers: withAuth(token),
      body:    JSON.stringify({ rewardItemId }),
    }),
};

// ── Admin API ──────────────────────────────────────────────────────────────

export const adminApi = {
  listRedemptions: (token: string) =>
    apiFetch<RedemptionResponse[]>("/api/admin/redemptions", {
      headers: withAuth(token),
    }),

  updateRedemptionStatus: (token: string, id: string, status: string, reason?: string) =>
    apiFetch<{ success: boolean }>(`/api/admin/redemptions/${id}/status`, {
      method:  "POST",
      headers: withAuth(token),
      body:    JSON.stringify({ status, reason }),
    }),

  listUploads: (token: string) =>
    apiFetch<UploadResponse[]>("/api/admin/uploads", {
      headers: withAuth(token),
    }),

  getAuditLogs: (token: string) =>
    apiFetch<AuditLogResponse[]>("/api/admin/audit", {
      headers: withAuth(token),
    }),
};

// ── Leader API ─────────────────────────────────────────────────────────────

export const leaderApi = {
  getTeamSummary: (token: string) =>
    apiFetch<TeamSummaryResponse[]>("/api/leader/team", {
      headers: withAuth(token),
    }),
};

// ── Response types (Frontend-safe DTOs — no Prisma) ───────────────────────

export interface EmployeeDashboardResponse {
  user:        { id: string; name: string; npk: string };
  tokenSummary: TokenSummaryResponse;
  recentRedemptions: RedemptionResponse[];
}

export interface TokenSummaryResponse {
  totalTokens:         number;
  currentTier:         "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  pointsToNextTier:    number;
  isEligibleForReward: boolean;
  activePeriod:        string;
  status:              "ACTIVE" | "DOWNGRADED" | "RESET" | "INACTIVE";
}

export interface RedemptionResponse {
  id:          string;
  status:      string;
  createdAt:   string;
  item: {
    id:         string;
    name:       string;
    tokenCost:  number;
    imageUrl?:  string;
  };
}

export interface UploadResponse {
  id:          string;
  filename:    string;
  status:      string;
  createdAt:   string;
  validRows:   number;
  errorRows:   number;
}

export interface AuditLogResponse {
  id:         string;
  action:     string;
  actorId:    string;
  actorName:  string;
  actorNpk:   string;
  targetId?:  string;
  targetType?: string;
  details:    Record<string, unknown>;
  createdAt:  string;
}

export interface TeamSummaryResponse {
  id:         string;
  name:       string;
  tokens:     number;
  tier:       string;
  status:     string;
  division:   string;
}
