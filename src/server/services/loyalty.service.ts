/**
 * Loyalty Engine — Domain Services
 *
 * Deterministic, testable business logic for token calculation,
 * tier determination, downgrade checks, and reset logic.
 *
 * IMPORTANT: These functions must NOT import from React or Next.js.
 * They are pure domain logic and must remain framework-agnostic.
 */

import type { MemberTierType } from "@prisma/client";

// Alias so pure-domain functions remain readable
type TierStatus = MemberTierType;

// ============================================================
// TIER THRESHOLDS
// These values should eventually come from a configurable rule
// table, but are hardcoded here for Phase 1 as per PRD.
// ============================================================

export const TIER_THRESHOLDS: Record<TierStatus, number> = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 3000,
  PLATINUM: 6000,
};

export const TIER_ORDER: TierStatus[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

// Minimum tokens required to be eligible for redemption
export const REDEMPTION_ELIGIBILITY_THRESHOLD = 2000;

// ============================================================
// TIER DETERMINATION
// ============================================================

/**
 * Determines the membership tier based on total token count.
 * Returns the highest tier the user qualifies for.
 */
export function determineTier(totalTokens: number): TierStatus {
  if (totalTokens >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalTokens >= TIER_THRESHOLDS.GOLD) return "GOLD";
  if (totalTokens >= TIER_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

/**
 * Returns the next tier above the current one, or null if already Platinum.
 */
export function getNextTier(current: TierStatus): TierStatus | null {
  const idx = TIER_ORDER.indexOf(current);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

/**
 * Returns the token delta needed to reach the next tier.
 */
export function getPointsToNextTier(totalTokens: number): number {
  const nextTier = getNextTier(determineTier(totalTokens));
  if (!nextTier) return 0;
  return Math.max(0, TIER_THRESHOLDS[nextTier] - totalTokens);
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
 * Each slot translates to a configurable token value.
 * Resigned employees earn 0 tokens.
 */
export function calculateOptelTokens(row: OptelSlotRow, tokensPerSlot = 100): number {
  if (row.isResigned || row.partnershipStatus !== "ACTIVE") return 0;
  return row.totalSlots * tokensPerSlot;
}

// ============================================================
// TECHNO TOKEN CALCULATION
// ============================================================

export interface TechnoSprintRow {
  npk: string;
  monthlySprints: number[];   // array of sprint values per month in period
  totalSprintPerPeriod: number;
  projectRejections: number;
  partnershipStatus: "ACTIVE" | "INACTIVE";
  isResigned: boolean;
}

/**
 * Calculates Techno token contribution from sprint data.
 * Rejected projects can reduce the effective sprint count by policy.
 * Resigned employees earn 0 tokens.
 */
export function calculateTechnoTokens(row: TechnoSprintRow, tokensPerSprint = 200): number {
  if (row.isResigned || row.partnershipStatus !== "ACTIVE") return 0;
  // Policy: each rejection reduces 1 sprint worth of tokens
  const effectiveSprints = Math.max(0, row.totalSprintPerPeriod - row.projectRejections);
  return effectiveSprints * tokensPerSprint;
}

// ============================================================
// DOWNGRADE LOGIC
// ============================================================

export interface DowngradeCheckInput {
  currentTier: TierStatus;
  projectRejections: number;   // for Techno
  missedSlots: number;         // for Optel (slots below minimum threshold)
  periodTokens: number;        // tokens earned this period
}

export interface DowngradeResult {
  shouldDowngrade: boolean;
  fromTier: TierStatus;
  toTier: TierStatus | null;
  reason: string | null;
}

// Configurable thresholds
const DOWNGRADE_REJECTION_LIMIT = 3;
const DOWNGRADE_MIN_PERIOD_TOKENS = 500;

/**
 * Checks if an employee should be downgraded based on business rules.
 * - Techno: 3+ project rejections triggers a one-level downgrade.
 * - Optel: Earning below minimum threshold triggers a one-level downgrade.
 */
export function checkDowngrade(input: DowngradeCheckInput): DowngradeResult {
  const { currentTier, projectRejections, missedSlots, periodTokens } = input;

  const isRejectionBreach = projectRejections >= DOWNGRADE_REJECTION_LIMIT;
  const isInsufficientEarning = periodTokens < DOWNGRADE_MIN_PERIOD_TOKENS;

  if (!isRejectionBreach && !isInsufficientEarning) {
    return { shouldDowngrade: false, fromTier: currentTier, toTier: null, reason: null };
  }

  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const toTier = currentIdx > 0 ? TIER_ORDER[currentIdx - 1] : currentTier;

  const reasons: string[] = [];
  if (isRejectionBreach) reasons.push(`${projectRejections} project rejections exceeded limit of ${DOWNGRADE_REJECTION_LIMIT}`);
  if (isInsufficientEarning) reasons.push(`Earned ${periodTokens} tokens, below ${DOWNGRADE_MIN_PERIOD_TOKENS} minimum`);

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
  consecutiveLowPeriods: number;  // periods in a row with < threshold earnings
  isInactive: boolean;             // flagged as inactive by HR
  isResigned: boolean;
}

export interface ResetResult {
  shouldReset: boolean;
  reason: string | null;
}

const RESET_CONSECUTIVE_PERIODS_LIMIT = 2;

/**
 * Checks if an employee's tokens should be reset to zero.
 * - 2+ consecutive low-performance periods triggers a reset.
 * - Resigned status triggers a reset.
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
      reason: `${consecutiveLowPeriods} consecutive periods below performance threshold.`,
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
 * All conditions must pass for eligibility.
 */
export function checkRedemptionEligibility(input: EligibilityCheckInput): EligibilityResult {
  const { totalTokens, rewardTokenCost, partnershipStatus, isResigned, memberStatus } = input;
  const reasons: string[] = [];

  if (isResigned) reasons.push("Resigned employees are not eligible for redemption.");
  if (partnershipStatus !== "ACTIVE") reasons.push("Partnership status must be active.");
  if (memberStatus === "RESET") reasons.push("Token balance has been reset; you are not eligible until next period.");
  if (totalTokens < rewardTokenCost) {
    reasons.push(`Insufficient tokens: you have ${totalTokens.toLocaleString()}, reward costs ${rewardTokenCost.toLocaleString()}.`);
  }
  if (totalTokens < REDEMPTION_ELIGIBILITY_THRESHOLD) {
    reasons.push(`Minimum ${REDEMPTION_ELIGIBILITY_THRESHOLD.toLocaleString()} tokens required for any redemption.`);
  }

  return { isEligible: reasons.length === 0, reasons };
}
