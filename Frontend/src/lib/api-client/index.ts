/**
 * Frontend/src/lib/api-client/index.ts
 *
 * Type-safe HTTP client for communicating with the Backend REST API.
 * All data fetching from the Frontend MUST go through this layer.
 *
 * SOLID — DIP: Frontend depends on this abstraction, not on DB/Prisma directly.
 * DRY: one fetch helper, one error-handling pattern, reused everywhere.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:4000";

// ── Base fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({ error: "Unknown error" }))) as { error?: string };
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
      next: { revalidate: 60 },
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
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ rewardItemId }),
    }),

  /** HC-02 read-only: returns the active reward catalog for employees */
  getRewardCatalog: (token: string) =>
    apiFetch<RewardCatalogItem[]>("/api/employee/rewards", {
      headers: withAuth(token),
      next: { revalidate: 30 },
    } as RequestInit),

  changePassword: (token: string, payload: Record<string, string>) =>
    apiFetch<{ success: boolean }>("/api/employee/profile/change-password", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),
};

// ── Admin API ──────────────────────────────────────────────────────────────

export const adminApi = {
  listRedemptions: (token: string) =>
    apiFetch<RedemptionResponse[]>("/api/admin/redemptions", {
      headers: withAuth(token),
    }),

  updateRedemptionStatus: (
    token: string,
    id: string,
    status: string,
    reason?: string,
  ) =>
    apiFetch<{ success: boolean }>(`/api/admin/redemptions/${id}/status`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ status, reason }),
    }),

  verifyRedemptionDocuments: (
    token: string,
    id: string,
    verification: {
      idCardVerified: boolean;
      ktpVerified: boolean;
      npwpVerified: boolean;
      powerOfAttorneyVerified?: boolean;
    },
  ) =>
    apiFetch<{ success: boolean }>(
      `/api/admin/redemptions/${id}/verify-documents`,
      {
        method: "POST",
        headers: withAuth(token),
        body: JSON.stringify(verification),
      },
    ),

  listUploads: (token: string) =>
    apiFetch<UploadResponse[]>("/api/admin/uploads", {
      headers: withAuth(token),
    }),

  getAuditLogs: (token: string) =>
    apiFetch<AuditLogResponse[]>("/api/admin/audit", {
      headers: withAuth(token),
    }),

  /** HC-01: Manual token adjustment — append-only ledger entry */
  createManualAdjustment: (
    token: string,
    payload: {
      mitraId: string;
      amount: number;
      reason: string;
    },
  ) =>
    apiFetch<{ success: boolean; ledgerEntryId: string }>(
      "/api/admin/adjustments",
      {
        method: "POST",
        headers: withAuth(token),
        body: JSON.stringify(payload),
      },
    ),

  /** HC-02: Reward Catalog — list all (incl. inactive) */
  listRewards: (token: string) =>
    apiFetch<RewardCatalogItem[]>("/api/admin/rewards", {
      headers: withAuth(token),
    }),

  /** HC-02: Create a new reward item */
  createReward: (
    token: string,
    payload: {
      name: string;
      description: string;
      tokenCost: number;
    },
  ) =>
    apiFetch<RewardCatalogItem>("/api/admin/rewards", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),

  /** HC-02: Update reward item */
  updateReward: (
    token: string,
    id: string,
    payload: Partial<{ name: string; description: string; tokenCost: number; isActive: boolean }>,
  ) =>
    apiFetch<RewardCatalogItem>(`/api/admin/rewards/${id}`, {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),

  /** HC-06: Request partner status confirmation from Team Leader */
  requestPartnerConfirmation: (
    token: string,
    payload: { mitraId: string; leaderId: string; reason?: string },
  ) =>
    apiFetch<PartnerConfirmationResponse>("/api/admin/partner-confirmations", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),

  /** HC-06: List all partner confirmation requests */
  listPartnerConfirmations: (token: string) =>
    apiFetch<PartnerConfirmationResponse[]>(
      "/api/admin/partner-confirmations",
      {
        headers: withAuth(token),
      },
    ),

  /** HC-06: Cancel a pending partner confirmation */
  cancelPartnerConfirmation: (token: string, id: string) =>
    apiFetch<{ success: boolean }>(
      `/api/admin/partner-confirmations/${id}/cancel`,
      {
        method: "POST",
        headers: withAuth(token),
      },
    ),
};

// ── Leader API ─────────────────────────────────────────────────────────────

export const leaderApi = {
  /** TL-02: Team-wide token and membership summary */
  getTeamSummary: (token: string) =>
    apiFetch<TeamSummaryResponse[]>("/api/leader/team", {
      headers: withAuth(token),
    }),

  /** TL-03: Detailed token history for a specific team member */
  getMemberDetail: (token: string, memberId: string) =>
    apiFetch<MemberDetailResponse>(`/api/leader/team/${memberId}`, {
      headers: withAuth(token),
    }),

  /** TL-01: List pending partner status confirmations for this leader */
  listPendingConfirmations: (token: string) =>
    apiFetch<PartnerConfirmationResponse[]>(
      "/api/leader/partner-confirmations",
      {
        headers: withAuth(token),
      },
    ),

  /** TL-01: Confirm or decline a partner status */
  confirmPartnerStatus: (
    token: string,
    id: string,
    payload: {
      confirmedStatus: "ACTIVE" | "RESIGNED";
      note?: string;
    },
  ) =>
    apiFetch<{ success: boolean }>(
      `/api/leader/partner-confirmations/${id}/confirm`,
      {
        method: "POST",
        headers: withAuth(token),
        body: JSON.stringify(payload),
      },
    ),
};

// ── Response types (Frontend-safe DTOs — no Prisma) ───────────────────────

export interface EmployeeDashboardResponse {
  user: { id: string; name: string; npk: string };
  tokenSummary: TokenSummaryResponse;
  recentRedemptions: RedemptionResponse[];
}

export interface TokenSummaryResponse {
  totalTokens: number;
  currentTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  pointsToNextTier: number;
  nextTier?: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  cumulativeValue: number;
  isEligibleForReward: boolean;
  periodEnd: string;
  memberStatus: "ACTIVE" | "INACTIVE" | "RESIGNED";
}

export interface RedemptionResponse {
  id: string;
  status: string;
  createdAt: string;
  item: {
    id: string;
    name: string;
    tokenCost: number;
    imageUrl?: string;
  };
}

export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  isActive: boolean;
  createdAt: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  status: string;
  createdAt: string;
  validRows: number;
  errorRows: number;
}

export interface AuditLogResponse {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorNpk: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface TeamSummaryResponse {
  id: string;
  name: string;
  tokens: number;
  tier: string;
  status: string;
  division: string;
}

export interface MemberDetailResponse {
  member: {
    id: string;
    name: string;
    npk: string;
    division: string;
    tier: string;
    status: string;
    totalTokens: number;
  };
  ledger: Array<{
    id: string;
    eventType: string;
    amount: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
  }>;
}

export interface PartnerConfirmationResponse {
  id: string;
  mitraId: string;
  mitraName: string;
  leaderId: string;
  leaderName: string;
  status: "PENDING" | "CONFIRMED_ACTIVE" | "CONFIRMED_RESIGNED" | "CANCELLED";
  reason: string | null;
  confirmedStatus: "ACTIVE" | "RESIGNED" | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
