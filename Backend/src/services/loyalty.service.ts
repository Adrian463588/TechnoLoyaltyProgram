/**
 * Backend/src/services/loyalty.service.ts
 *
 * Loyalty Engine — Pure domain logic for token calculations,
 * tier determination, downgrade checks, and reset logic.
 *
 * IMPORTANT: Do NOT import from React or Next.js here.
 * This file is framework-agnostic domain logic.
 *
 * Single Source of Truth: All tier constants imported from loyalty.policy.ts.
 */

import type { MemberTierType } from "@prisma/client";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";

// Alias for readability
type TierStatus = MemberTierType;

// ── Re-exports for backward compatibility ─────────────────────
// Services should import from loyalty.policy.ts directly, but these
// re-exports allow existing service code to keep its imports.
export const TIER_THRESHOLDS = LOYALTY_POLICIES.TIER_THRESHOLDS;
export const TIER_ORDER = LOYALTY_POLICIES.TIER_ORDER;
export const REDEMPTION_ELIGIBILITY_THRESHOLD = LOYALTY_POLICIES.REDEMPTION_THRESHOLD;

// ============================================================
// TIER DETERMINATION
// ============================================================

/**
 * Determines the membership tier based on total token count.
 * Delegates to the centralized policy — single source of truth.
 */
export function determineTier(totalTokens: number): TierStatus {
  return LOYALTY_POLICIES.calculateTier(totalTokens);
}

/**
 * Returns the next tier above the current one, or null if already Platinum.
 */
export function getNextTier(current: TierStatus): TierStatus | null {
  const idx = LOYALTY_POLICIES.TIER_ORDER.indexOf(current);
  return idx < LOYALTY_POLICIES.TIER_ORDER.length - 1
    ? (LOYALTY_POLICIES.TIER_ORDER[idx + 1] as TierStatus)
    : null;
}

/**
 * Returns the token delta needed to reach the next tier.
 */
export function getPointsToNextTier(totalTokens: number): number {
  const nextTier = getNextTier(determineTier(totalTokens));
  if (!nextTier) return 0;
  return Math.max(0, LOYALTY_POLICIES.TIER_THRESHOLDS[nextTier] - totalTokens);
}

// ============================================================
// OPTEL TOKEN CALCULATION
// ============================================================

export interface OptelSlotRow {
  npk: string;
  slots: number;
  regularSlots: number;
  totalSlots: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
}

/**
 * Calculates Optel token contribution from slot data.
 * Uses centralized conversion rate from loyalty.policy.ts.
 */
export function calculateOptelTokens(
  row: OptelSlotRow,
  tokensPerSlot = LOYALTY_POLICIES.OPTEL_CONVERSION.PER_SLOT_VALUE,
): number {
  if (row.isResigned || row.partnershipStatus !== "ACTIVE") return 0;
  return row.totalSlots * tokensPerSlot;
}

// ============================================================
// TECHNO TOKEN CALCULATION
// ============================================================

export interface TechnoSprintRow {
  npk: string;
  monthlySprints: number[];
  totalSprintPerPeriod: number;
  projectRejections: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
}

/**
 * Calculates Techno token contribution from sprint data.
 * Uses centralized conversion rate from loyalty.policy.ts.
 */
export function calculateTechnoTokens(
  row: TechnoSprintRow,
  tokensPerSprint = LOYALTY_POLICIES.TECHNO_CONVERSION.PER_SPRINT_VALUE,
): number {
  if (row.isResigned || row.partnershipStatus !== "ACTIVE") return 0;
  const effectiveSprints = Math.max(0, row.totalSprintPerPeriod - row.projectRejections);
  return effectiveSprints * tokensPerSprint;
}

// ============================================================
// DOWNGRADE LOGIC
// ============================================================

export interface DowngradeCheckInput {
  currentTier: TierStatus;
  projectRejections: number;
  missedSlots: number;
  periodTokens: number;
}

export interface DowngradeResult {
  shouldDowngrade: boolean;
  fromTier: TierStatus;
  toTier: TierStatus | null;
  reason: string | null;
}

const DOWNGRADE_REJECTION_LIMIT = 3;
const DOWNGRADE_MIN_PERIOD_TOKENS = 500;

/**
 * Checks if an employee should be downgraded based on business rules.
 */
export function checkDowngrade(input: DowngradeCheckInput): DowngradeResult {
  const { currentTier, projectRejections, periodTokens } = input;

  const isRejectionBreach = projectRejections >= DOWNGRADE_REJECTION_LIMIT;
  const isInsufficientEarning = periodTokens < DOWNGRADE_MIN_PERIOD_TOKENS;

  if (!isRejectionBreach && !isInsufficientEarning) {
    return { shouldDowngrade: false, fromTier: currentTier, toTier: null, reason: null };
  }

  const currentIdx = LOYALTY_POLICIES.TIER_ORDER.indexOf(currentTier);
  const toTier =
    currentIdx > 0
      ? (LOYALTY_POLICIES.TIER_ORDER[currentIdx - 1] as TierStatus)
      : currentTier;

  const reasons: string[] = [];
  if (isRejectionBreach) {
    reasons.push(
      `${String(projectRejections)} project rejections exceeded limit of ${String(DOWNGRADE_REJECTION_LIMIT)}`,
    );
  }
  if (isInsufficientEarning) {
    reasons.push(
      `Earned ${String(periodTokens)} tokens, below ${String(DOWNGRADE_MIN_PERIOD_TOKENS)} minimum`,
    );
  }

  return {
    shouldDowngrade: toTier !== currentTier,
    fromTier: currentTier,
    toTier,
    reason: reasons.join("; "),
  };
}

// ============================================================
// RESET LOGIC
// ============================================================

export interface ResetCheckInput {
  consecutiveLowPeriods: number;
  isInactive: boolean;
  isResigned: boolean;
}

export interface ResetResult {
  shouldReset: boolean;
  reason: string | null;
}

const RESET_CONSECUTIVE_PERIODS_LIMIT = 2;

/**
 * Checks if an employee's tokens should be reset to zero.
 */
export function checkReset(input: ResetCheckInput): ResetResult {
  const { consecutiveLowPeriods, isInactive, isResigned } = input;

  if (isResigned) {
    return { shouldReset: true, reason: "Employee has resigned from the company." };
  }
  if (isInactive) {
    return { shouldReset: true, reason: "Employee flagged as inactive by HR." };
  }
  if (consecutiveLowPeriods >= RESET_CONSECUTIVE_PERIODS_LIMIT) {
    return {
      shouldReset: true,
      reason: `${String(consecutiveLowPeriods)} consecutive periods below performance threshold.`,
    };
  }

  return { shouldReset: false, reason: null };
}

// ============================================================
// REDEMPTION ELIGIBILITY
// ============================================================

export interface EligibilityCheckInput {
  totalTokens: number;
  rewardTokenCost: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
  memberStatus: "ACTIVE" | "DOWNGRADED" | "RESET" | "INACTIVE";
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

/**
 * Validates whether an employee can redeem a specific reward.
 */
export function checkRedemptionEligibility(
  input: EligibilityCheckInput,
): EligibilityResult {
  const { totalTokens, rewardTokenCost, partnershipStatus, isResigned, memberStatus } =
    input;
  const reasons: string[] = [];

  if (isResigned) reasons.push("Resigned employees are not eligible for redemption.");
  if (partnershipStatus !== "ACTIVE") reasons.push("Partnership status must be active.");
  if (memberStatus === "RESET") {
    reasons.push("Token balance has been reset; you are not eligible until next period.");
  }
  if (totalTokens < rewardTokenCost) {
    reasons.push(
      `Insufficient tokens: you have ${totalTokens.toLocaleString()}, reward costs ${rewardTokenCost.toLocaleString()}.`,
    );
  }
  if (totalTokens < LOYALTY_POLICIES.REDEMPTION_THRESHOLD) {
    reasons.push(
      `Minimum ${LOYALTY_POLICIES.REDEMPTION_THRESHOLD.toLocaleString()} tokens required for any redemption.`,
    );
  }

  return { isEligible: reasons.length === 0, reasons };
}
