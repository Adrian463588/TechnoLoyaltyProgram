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

import { MembershipTier, PartnerStatus, Division } from "@prisma/client";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";

// ============================================================
// TIER DETERMINATION
// ============================================================

/**
 * Determines the membership tier based on division and cumulative value.
 */
export function determineTier(division: Division, cumulativeValue: number): MembershipTier {
  if (division === Division.TECHNO) {
    return LOYALTY_POLICIES.calculateTechnoTier(cumulativeValue);
  }
  return LOYALTY_POLICIES.calculateOpcentTeleTier(cumulativeValue);
}

/**
 * Returns the next tier above the current one, or null if already Diamond.
 */
export function getNextTier(current: MembershipTier): MembershipTier | null {
  const idx = LOYALTY_POLICIES.TIER_ORDER.indexOf(current);
  return idx < LOYALTY_POLICIES.TIER_ORDER.length - 1
    ? (LOYALTY_POLICIES.TIER_ORDER[idx + 1] as MembershipTier)
    : null;
}

// ============================================================
// REDEMPTION ELIGIBILITY
// ============================================================

export interface EligibilityCheckInput {
  tokenBalance: number;
  rewardTokenCost: number;
  partnerStatus: PartnerStatus;
  isItemActive: boolean;
  stock?: number | null;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

/**
 * Validates whether an employee can redeem a specific reward.
 * Logic from PRD Section 6.6.
 */
export function checkRedemptionEligibility(
  input: EligibilityCheckInput,
): EligibilityResult {
  const { tokenBalance, rewardTokenCost, partnerStatus, isItemActive, stock } = input;
  const reasons: string[] = [];

  if (partnerStatus !== PartnerStatus.ACTIVE) {
    reasons.push("Only active partners are eligible for redemption.");
  }
  if (!isItemActive) {
    reasons.push("This reward item is no longer active.");
  }
  if (stock !== undefined && stock !== null && stock <= 0) {
    reasons.push("This reward item is out of stock.");
  }
  if (tokenBalance < rewardTokenCost) {
    reasons.push(
      `Insufficient tokens: you have ${tokenBalance.toLocaleString()}, reward costs ${rewardTokenCost.toLocaleString()}.`,
    );
  }

  return { isEligible: reasons.length === 0, reasons };
}
