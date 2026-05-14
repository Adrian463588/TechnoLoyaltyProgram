/**
 * Backend/src/types/domain.types.ts
 *
 * Canonical domain types — aligned with Prisma enum values (SCREAMING_SNAKE_CASE).
 * The Frontend types/index.ts must mirror these exactly.
 *
 * DO NOT add business logic here. Types only.
 */

import type {
  RoleType,
  DivisionType,
  MemberTierType,
  RedemptionStatus,
  UploadStatus,
} from "@prisma/client";

// ── Re-exported Prisma enum types ────────────────────────────
export type Role = RoleType;                        // MITRA | TEAM_LEADER | HC_PM
export type Division = DivisionType;                // OPTEL | TECHNO
export type TierStatus = MemberTierType;            // BRONZE | SILVER | GOLD | PLATINUM
export type RewardRequestStatus = RedemptionStatus; // DRAFT | PENDING_VERIFICATION | ...

// ── Member Status ─────────────────────────────────────────────
export type MemberStatus = "ACTIVE" | "DOWNGRADED" | "RESET" | "INACTIVE";

// ── Upload Status ─────────────────────────────────────────────
export type { UploadStatus };

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  npk: string;
  role: Role;
  divisionId: string | null;
  teamId: string | null;
}

// ── Token Summary (employee dashboard) ───────────────────────
export interface TokenSummary {
  userId: string;
  totalTokens: number;
  remainingTokens: number;
  currentTier: TierStatus;
  pointsToNextTier: number;
  totalForNextTier: number;
  isEligibleForReward: boolean;
  activePeriod: string;
  activePeriodStart: string;
  activePeriodEnd: string;
  memberStatus: MemberStatus;
}

// ── Reward ────────────────────────────────────────────────────
export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  tokenCost: number;
  imageUrl: string | null;
  isAvailable: boolean;
  stockLimit: number | null;
}

// ── Redemption Request ────────────────────────────────────────
export interface RewardRequest {
  id: string;
  userId: string;
  userName?: string;
  userNpk?: string;
  rewardId: string;
  rewardName: string;
  tokensSpent: number;
  status: RewardRequestStatus;
  requestedAt: string;
  updatedAt: string;
  rejectReason?: string | null;
}

// ── Upload ────────────────────────────────────────────────────
export interface UploadValidationIssue {
  row: number;
  column: string;
  issue: string;
  severity: "ERROR" | "WARNING";
}

export interface MonthlyUpload {
  id: string;
  filename: string;
  divisionType: Division;
  uploadedAt: string;
  status: UploadStatus;
  validRows: number;
  errorRows: number;
  issues?: UploadValidationIssue[];
}

// ── Team ──────────────────────────────────────────────────────
export interface TeamMemberSummary {
  id: string;
  name: string;
  npk: string;
  division: Division;
  tokens: number;
  tier: TierStatus;
  memberStatus: MemberStatus;
}

// ── Employee Dashboard (full) ─────────────────────────────────
export interface EmployeeDashboardData {
  user: {
    id: string;
    name: string;
    npk: string;
    division: Division;
  };
  tokenSummary: TokenSummary;
  recentRedemptions: RewardRequest[];
}

// ── Audit ──────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}
