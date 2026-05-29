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
  "http://localhost:8080";

// ── Base fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  
  const headers: Record<string, string> = { ...options.headers as Record<string, string> };
  
  // Only default to JSON if no content-type is set AND body is NOT FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

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
      cache: "no-store",
    } as RequestInit),

  getTokenSummary: (token: string) =>
    apiFetch<TokenSummaryResponse>("/api/employee/token-summary", {
      headers: withAuth(token),
    }),

  getMyRedemptions: (token: string) =>
    apiFetch<RedemptionResponse[]>("/api/employee/redemptions", {
      headers: withAuth(token),
      cache: "no-store",
    } as RequestInit),

  createRedemption: (token: string, rewardItemId: string, options?: { isRepresented?: boolean, file?: File }) => {
    const formData = new FormData();
    formData.append("rewardItemId", rewardItemId);
    if (options?.isRepresented) {
      formData.append("isRepresented", "true");
    }
    if (options?.file) {
      formData.append("file", options.file);
    }

    return apiFetch<RedemptionResponse>("/api/employee/redemptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },

  /** HC-02 read-only: returns the active reward catalog for employees */
  getRewardCatalog: (token: string) =>
    apiFetch<RewardCatalogItem[]>("/api/employee/rewards", {
      headers: withAuth(token),
      cache: "no-store",
    } as RequestInit),

  cancelRedemption: (token: string, id: string) =>
    apiFetch<{ success: boolean }>((`/api/employee/redemptions/${id}/cancel`), {
      method: "POST",
      headers: withAuth(token),
    }),

  getTokenHistory: (token: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<TokenHistoryResponse>(`/api/employee/history?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

  changePassword: (token: string, payload: Record<string, string>) =>
    apiFetch<void>("/api/employee/profile/change-password", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),

  // ── Documents ─────────────────────────────────────────────────────────────
  getDocuments: (token: string) =>
    apiFetch<UserDocumentResponse[]>("/api/employee/documents", {
      headers: withAuth(token),
    }),

  uploadDocument: (token: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    return apiFetch<UserDocumentResponse>("/api/employee/documents/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },

  deleteDocument: (token: string, type: string) =>
    apiFetch<void>(`/api/employee/documents/${type}`, {
      method: "DELETE",
      headers: withAuth(token),
    }),
};

// ── Admin API ──────────────────────────────────────────────────────────────

export const adminApi = {
  listRedemptions: (token: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<AdminRedemptionResponse>(`/api/admin/redemptions?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

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

  getAuditLogs: (token: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<AdminAuditLogResponse>(`/api/admin/audit?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

  listUsers: (token: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    query.append("includeInactive", "true");
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<AdminUserListResponse>(`/api/admin/users?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

  /** HC-01: Update user status (ACTIVE/INACTIVE/RESIGNED) */
  updateUserStatus: (token: string, userId: string, status: "ACTIVE" | "INACTIVE" | "RESIGNED") =>
    apiFetch<{ success: boolean; user: UserResponse }>("/api/admin/users/status", {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ userId, status }),
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
    apiFetch<RewardCatalogItem[]>("/api/admin/rewards?includeInactive=true", {
      headers: withAuth(token),
    }),

  /** HC-02: Create a new reward item */
  createReward: (
    token: string,
    payload: {
      name: string;
      description: string;
      tokenCost: number;
      stock?: number | null;
      imageUrl?: string;
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
    payload: Partial<{ name: string; description: string; tokenCost: number; stock: number | null; imageUrl: string; isActive: boolean }>,
  ) =>
    apiFetch<RewardCatalogItem>(`/api/admin/rewards/${id}`, {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),

  /** HC-02: Toggle reward active/inactive status */
  toggleRewardStatus: (token: string, id: string, active: boolean) =>
    apiFetch<{ success: boolean; item: RewardCatalogItem }>(`/api/admin/rewards/${id}/toggle-status`, {
      method: "POST",
      headers: withAuth(token),
      body: JSON.stringify({ active }),
    }),

  /** HC-02: Permanently delete reward item */
  deleteReward: (token: string, id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/admin/rewards/${id}`, {
      method: "DELETE",
      headers: withAuth(token),
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
  listPartnerConfirmations: (token: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<AdminPartnerConfirmationResponse>(
      `/api/admin/partner-confirmations?${query.toString()}`,
      {
        headers: withAuth(token),
      },
    );
  },

  /** HC-06: Cancel a pending partner confirmation */
  cancelPartnerConfirmation: (token: string, id: string) =>
    apiFetch<{ success: boolean }>(
      `/api/admin/partner-confirmations/${id}/cancel`,
      {
        method: "POST",
        headers: withAuth(token),
      },
    ),

  /** HC: Get global system settings (Earning periods, etc.) */
  getSystemSettings: (token: string) =>
    apiFetch<SystemSettingsResponse>("/api/admin/system-settings", {
      headers: withAuth(token),
      cache: "no-store",
    } as RequestInit),

  /** HC: Update global system settings */
  updateSystemSettings: (token: string, payload: Partial<Omit<SystemSettingsResponse, "id" | "updatedAt">>) =>
    apiFetch<{ success: boolean; settings: SystemSettingsResponse }>("/api/admin/system-settings", {
      method: "PATCH",
      headers: withAuth(token),
      body: JSON.stringify(payload),
    }),
};

// ── Leader API ─────────────────────────────────────────────────────────────

export const leaderApi = {
  /** TL-02: Team-wide token and membership summary */
  getTeamSummary: (token: string) =>
    apiFetch<TeamSummaryResult>("/api/leader/team", {
      headers: withAuth(token),
    }),

  /** TL-03: Detailed token history for a specific team member */
  getMemberDetail: (token: string, memberId: string, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());
    return apiFetch<MemberDetailResponse>(`/api/leader/team/${memberId}?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

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

export interface UserDocumentResponse {
  id: string;
  userId: string;
  type: "ID_CARD_MITRA" | "KTP" | "NPWP";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface EmployeeDashboardResponse {
  user: { 
    id: string; 
    name: string; 
    npk: string;
    membershipTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  };
  tokenSummary: TokenSummaryResponse;
  recentRedemptions: RedemptionResponse[];
  recentTransactions: TokenLedgerEntryResponse[];
}

export interface TokenLedgerEntryResponse {
  id: string;
  eventType: string;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface TokenHistoryResponse {
  entries: TokenLedgerEntryResponse[];
  limit: number;
  offset: number;
  total: number;
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
  mitra?: {
    id: string;
    name: string;
    email: string;
    npk: string;
    division?: string;
    documents?: Array<{
      id: string;
      type: "ID_CARD_MITRA" | "KTP" | "NPWP";
      fileUrl: string;
    }>;
  } | null;
  item: {
    id: string;
    name: string;
    tokenCost: number;
    imageUrl?: string;
  };
  isRepresented: boolean;
  powerOfAttorneyUrl?: string | null;
  idCardVerified: boolean;
  ktpVerified: boolean;
  npwpVerified: boolean;
  powerOfAttorneyVerified: boolean | null;
  rejectReason?: string | null;
}

export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  imageUrl?: string;
  stock: number | null;
  minTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
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
  npk: string;
  division: string;
  membershipTier: string;
  partnerStatus: string;
  currentBalance: number;
}

export interface TeamSummaryResult {
  teamLeadId: string;
  members: TeamSummaryResponse[];
  count: number;
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
  total: number;
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

export interface AdminRedemptionResponse {
  requests: RedemptionResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminAuditLogResponse {
  logs: AuditLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserListResponse {
  users: UserResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminPartnerConfirmationResponse {
  items: PartnerConfirmationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface SystemSettingsResponse {
  id: string;
  p1Start: string;
  p1End: string;
  p2Start: string;
  p2End: string;
  claimP1Start: string;
  claimP1End: string;
  claimP2Start: string;
  claimP2End: string;
  rewardPickupLocation: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  name: string;
  npk: string;
  email: string;
  division: string;
  role: string;
  membershipTier: string;
  partnerStatus: "ACTIVE" | "INACTIVE" | "RESIGNED";
  tokens?: number;
}
