/**
 * Backend/src/domain/membership/tier-engine.domain.ts
 *
 * Membership Tier Engine — Pure domain logic for tier calculations.
 * SOLID — SRP: handles only membership tier determination.
 * 
 * Business Rules (PRD Section 6):
 * - Opcent/Tele: Annual evaluation, thresholds 430/860/1300
 * - Techno: 6-month evaluation, thresholds 25/50/75
 */

import { MemberTierType, DivisionType } from "@prisma/client";
import { opcentTokenEngine } from "../token-engine/opcent/engine";
import { technoTokenEngine } from "../token-engine/techno/engine";
import { getTokenEngine } from "../token-engine";

// ============================================================
// TIER ORDER (shared)
// ============================================================

export const TIER_ORDER: MemberTierType[] = [
  MemberTierType.SAPHIRE,
  MemberTierType.EMERALD,
  MemberTierType.RUBY,
  MemberTierType.DIAMOND,
];

// ============================================================
// TIER CALCULATION
// ============================================================

/**
 * Determines the membership tier based on division and cumulative value.
 * Delegates to the appropriate token engine.
 */
export function calculateMembershipTier(
  division: DivisionType,
  cumulativeValue: number,
  referenceDate?: Date
): MemberTierType {
  const engine = getTokenEngine(division);
  return engine.calculate(cumulativeValue, referenceDate).tier;
}

/**
 * Gets the next tier above the current one.
 */
export function getNextTier(current: MemberTierType): MemberTierType | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) {
    return null;
  }
  return TIER_ORDER[idx + 1] ?? null;
}

/**
 * Gets the tier below the current one.
 */
export function getPreviousTier(current: MemberTierType): MemberTierType | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx <= 0) {
    return null;
  }
  return TIER_ORDER[idx - 1] ?? null;
}

// ============================================================
// TIER THRESHOLDS
// ============================================================

export function getTierThreshold(division: DivisionType, tier: MemberTierType): number {
  switch (division) {
    case DivisionType.OPCENT:
    case DivisionType.TELE:
      return opcentTokenEngine.getConfig().tierThresholds[tier];
    case DivisionType.TECHNO:
      return technoTokenEngine.getConfig().tierThresholds[tier];
    default:
      return 0;
  }
}

export function getNextTierThreshold(division: DivisionType, currentTier: MemberTierType): number | null {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) {
    return null;
  }
  return getTierThreshold(division, nextTier);
}

// ============================================================
// TIER VALIDATION
// ============================================================

/**
 * Validates if a tier transition is valid.
 */
export function isValidTierTransition(
  fromTier: MemberTierType,
  toTier: MemberTierType,
  direction: "up" | "down"
): boolean {
  const fromIdx = TIER_ORDER.indexOf(fromTier);
  const toIdx = TIER_ORDER.indexOf(toTier);
  
  if (direction === "up") {
    return toIdx > fromIdx;
  } else {
    return toIdx < fromIdx;
  }
}

/**
 * Checks if the user qualifies for a tier upgrade.
 */
export function qualifiesForUpgrade(
  division: DivisionType,
  currentTier: MemberTierType,
  cumulativeValue: number
): { qualified: boolean; nextTier: MemberTierType | null; pointsNeeded: number | null } {
  const nextTier = getNextTier(currentTier);
  
  if (!nextTier) {
    return { qualified: false, nextTier: null, pointsNeeded: null };
  }
  
  const threshold = getTierThreshold(division, nextTier);
  const pointsNeeded = threshold - cumulativeValue;
  
  return {
    qualified: cumulativeValue >= threshold,
    nextTier,
    pointsNeeded: pointsNeeded > 0 ? pointsNeeded : 0,
  };
}

/**
 * Checks if the user is at risk of downgrade.
 */
export function isAtRiskOfDowngrade(
  division: DivisionType,
  currentTier: MemberTierType,
  consecutiveInactiveMonths: number
): boolean {
  // Downgrade risk starts after 2 consecutive inactive months
  // (triggers on 3rd month)
  return consecutiveInactiveMonths >= 2 && currentTier !== MemberTierType.SAPHIRE;
}

// ============================================================
// TIER REPRESENTATION
// ============================================================

export type TierDisplayName = "Saphire" | "Emerald" | "Ruby" | "Diamond";

export function getTierDisplayName(tier: MemberTierType): TierDisplayName {
  switch (tier) {
    case MemberTierType.SAPHIRE: return "Saphire";
    case MemberTierType.EMERALD: return "Emerald";
    case MemberTierType.RUBY: return "Ruby";
    case MemberTierType.DIAMOND: return "Diamond";
    default: return "Saphire";
  }
}

export function getTierColor(tier: MemberTierType): string {
  switch (tier) {
    case MemberTierType.SAPHIRE: return "#94A3B8"; // Slate
    case MemberTierType.EMERALD: return "#6BCE53"; // Green
    case MemberTierType.RUBY: return "#EF4444"; // Red
    case MemberTierType.DIAMOND: return "#67E8F9"; // Cyan
    default: return "#94A3B8";
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { TIER_ORDER as tierOrder };