import { HealthBenefit, MemberTierType } from "@prisma/client";

export interface TierCalculationResult {
  tier: MemberTierType;
  healthBenefit: HealthBenefit;
  threshold: number;
  nextTier: MemberTierType | null;
  pointsToNext: number | null;
}

export interface PeriodInfo {
  start: Date;
  end: Date;
}

export interface TokenEngine {
  /**
   * Calculate tokens based on the division's specific unit (slots or projects).
   */
  calculateTokens(units: number): number;

  /**
   * Calculate membership tier based on cumulative units.
   */
  calculateTier(cumulativeUnits: number): TierCalculationResult;

  /**
   * Determine health benefit for a given tier.
   */
  getHealthBenefit(tier: MemberTierType): HealthBenefit;

  /**
   * Get the current evaluation period based on the given reference date.
   */
  getCurrentPeriod(referenceDate?: Date): PeriodInfo;
}
