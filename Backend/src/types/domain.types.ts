/**
 * Backend/src/types/domain.types.ts
 *
 * Canonical domain types — aligned with Prisma enum values (SCREAMING_SNAKE_CASE).
 * The Frontend types/index.ts must mirror these exactly.
 *
 * DO NOT add business logic here. Types only.
 */

import type {
  UserRole,
  DivisionType as PrismaDivision,
  MemberTierType,
  RedemptionStatus,
  PartnershipStatus,
} from "@prisma/client";

// ── Re-exported Prisma enum types ────────────────────────────
export type Role = UserRole;                        // MITRA | TEAM_LEADER | HC_PM
export type DivisionType = PrismaDivision;          // OPCENT | TELE | TECHNO
export type TierStatus = MemberTierType;            // SAPHIRE | EMERALD | RUBY | DIAMOND
export type RewardRequestStatus = RedemptionStatus; // DRAFT | PENDING_VERIFICATION | ...
export type PartnerStatus = PartnershipStatus;      // ACTIVE | INACTIVE | RESIGNED

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  division: DivisionType;
  partnerStatus: PartnerStatus;
  membershipTier: TierStatus;
}

// ── Token Summary (employee dashboard) ───────────────────────
export interface TokenSummary {
  userId: string;
  totalTokens: number;
  currentTier: TierStatus;
  pointsToNextTier: number | null;
  nextTier: TierStatus | null;
  isEligibleForReward: boolean;
  memberStatus: PartnerStatus;
  cumulativeValue: number;
  periodEnd: string;
}

// ── Reward ────────────────────────────────────────────────────
export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  tokenCost: number;
  imageUrl: string | null;
  isActive: boolean;
  stock: number | null;
}

// ── Redemption Request ────────────────────────────────────────
export interface RewardRequest {
  id: string;
  mitraId: string;
  userName?: string;
  userEmail?: string;
  rewardId: string;
  rewardName: string;
  tokenCost: number;
  status: RewardRequestStatus;
  submittedAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
}

// ── Token Ledger Entry ───────────────────────────────────────
export interface TokenLedgerEntry {
  id: string;
  eventType: string; // EARNED_SHIFT, REDEEMED, etc.
  amount: number;
  balanceAfter: number;
  reason: string | null;
  createdAt: string;
}

// ── Employee Dashboard (full) ─────────────────────────────────
export interface EmployeeDashboardData {
  user: User;
  tokenSummary: TokenSummary;
  recentRedemptions: RewardRequest[];
  recentTransactions: TokenLedgerEntry[];
}
