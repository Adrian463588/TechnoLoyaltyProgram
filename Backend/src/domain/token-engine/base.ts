/**
 * Backend/src/domain/token-engine/base.ts
 *
 * Base interfaces and utilities for token calculation engines.
 * SOLID — ISP: small, focused interfaces for different engine types.
 */

import { MemberTierType, HealthBenefit, DivisionType } from "@prisma/client";

// ============================================================
// SHARED TYPES
// ============================================================

export interface TokenEngineResult {
  tokens: number;
  tier: MemberTierType;
  healthBenefit: HealthBenefit;
  pointsToNextTier: number | null;
  nextTier: MemberTierType | null;
  isWithinEvaluationPeriod: boolean;
  evaluationDeadline: Date | null;
}

export interface TokenEngineConfig {
  division: DivisionType;
  evaluationDeadline: Date; // Dec 15 for Opcent/Tele, Jun 15 for Techno
  tierThresholds: Record<MemberTierType, number>;
  healthBenefits: Record<MemberTierType, HealthBenefit>;
}

// ============================================================
// SHARED UTILITIES
// ============================================================

/**
 * Determines the next tier above the current one.
 */
export function getNextTier(
  currentTier: MemberTierType,
  tierOrder: MemberTierType[]
): MemberTierType | null {
  const idx = tierOrder.indexOf(currentTier);
  if (idx < 0 || idx >= tierOrder.length - 1) {
    return null;
  }
  return tierOrder[idx + 1] ?? null;
}

/**
 * Calculates points needed to reach the next tier.
 */
export function calculatePointsToNextTier(
  currentValue: number,
  currentTier: MemberTierType,
  tierThresholds: Record<MemberTierType, number>,
  tierOrder: MemberTierType[]
): number | null {
  const nextTier = getNextTier(currentTier, tierOrder);
  if (!nextTier) {
    return null; // Already at highest tier
  }
  
  const nextThreshold = tierThresholds[nextTier];
  if (nextThreshold === undefined) {
    return null;
  }
  
  const pointsNeeded = nextThreshold - currentValue;
  return Math.max(0, pointsNeeded);
}

/**
 * Maps membership tier to health benefit.
 */
export function getHealthBenefitForTier(
  tier: MemberTierType,
  healthBenefits: Record<MemberTierType, HealthBenefit>
): HealthBenefit {
  return healthBenefits[tier] ?? HealthBenefit.NONE;
}

/**
 * Determines if a date is within the evaluation period.
 */
export function isWithinEvaluationPeriod(
  referenceDate: Date,
  periodStart: Date,
  periodEnd: Date
): boolean {
  const time = referenceDate.getTime();
  return time >= periodStart.getTime() && time <= periodEnd.getTime();
}

/**
 * Creates a date at 23:59:59 of the given date.
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

/**
 * Creates a date at 00:00:00 of the given date.
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

// ============================================================
// TIER ORDER (shared across engines)
// ============================================================

export const TIER_ORDER: MemberTierType[] = [
  MemberTierType.SAPHIRE,
  MemberTierType.EMERALD,
  MemberTierType.RUBY,
  MemberTierType.DIAMOND,
];

// ============================================================
// DEFAULT HEALTH BENEFITS
// ============================================================

export const DEFAULT_HEALTH_BENEFITS: Record<MemberTierType, HealthBenefit> = {
  [MemberTierType.SAPHIRE]: HealthBenefit.NONE,
  [MemberTierType.EMERALD]: HealthBenefit.FIT,
  [MemberTierType.RUBY]: HealthBenefit.FIT,
  [MemberTierType.DIAMOND]: HealthBenefit.CLASSY,
};