/**
 * Backend/src/services/membership.service.ts
 *
 * Domain service for membership tier calculations and health benefit mapping.
 * SOLID — SRP: only handles membership business logic.
 */

import { MemberTierType, HealthBenefit, DivisionType } from "@prisma/client";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";

export interface TierCalculationResult {
  tier: MemberTierType;
  healthBenefit: HealthBenefit;
  threshold: number;
  nextTier: MemberTierType | null;
  pointsToNext: number | null;
}

export class MembershipService {
  /**
   * Calculates the current tier and benefit based on division and cumulative metrics.
   */
  calculateTier(division: DivisionType, cumulativeValue: number): TierCalculationResult {
    let tier: MemberTierType;
    let thresholds: Record<MemberTierType, number>;

    if (division === DivisionType.TECHNO) {
      tier = LOYALTY_POLICIES.calculateTechnoTier(cumulativeValue);
      thresholds = LOYALTY_POLICIES.TECHNO_THRESHOLDS;
    } else {
      tier = LOYALTY_POLICIES.calculateOpcentTeleTier(cumulativeValue);
      thresholds = LOYALTY_POLICIES.OPCENT_TELE_THRESHOLDS;
    }

    const healthBenefit = this.getHealthBenefit(tier);
    const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
    const currentIdx = tierOrder.indexOf(tier);
    
    const nextTier = (currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null) as MemberTierType | null;
    const pointsToNext = nextTier ? Math.max(0, (thresholds[nextTier] ?? 0) - cumulativeValue) : null;

    return {
      tier,
      healthBenefit,
      threshold: thresholds[tier] ?? 0,
      nextTier,
      pointsToNext,
    };
  }

  /**
   * Returns the start and end dates of the current evaluation period.
   */
  getCurrentPeriodDates(division: DivisionType, referenceDate: Date = new Date()): { start: Date; end: Date } {
    const year = referenceDate.getFullYear();
    const { PERIODS } = LOYALTY_POLICIES;

    if (division === DivisionType.TECHNO) {
      // Techno: 6-month evaluation (P1 or P2)
      const p1End = new Date(year, PERIODS.P1_END.month, PERIODS.P1_END.day, 23, 59, 59);
      
      if (referenceDate <= p1End) {
        // In P1 (Dec 16 previous year to June 15 current year)
        return {
          start: new Date(year - 1, PERIODS.P1_START.month, PERIODS.P1_START.day),
          end:   p1End,
        };
      } else {
        // In P2 (June 16 to Dec 15 current year)
        return {
          start: new Date(year, PERIODS.P2_START.month, PERIODS.P2_START.day),
          end:   new Date(year, PERIODS.P2_END.month, PERIODS.P2_END.day, 23, 59, 59),
        };
      }
    } else {
      // Opcent/Tele: Annual evaluation (Dec 16 previous year to Dec 15 current year)
      const annualEnd = new Date(year, PERIODS.P2_END.month, PERIODS.P2_END.day, 23, 59, 59);
      
      if (referenceDate <= annualEnd) {
        return {
          start: new Date(year - 1, PERIODS.P1_START.month, PERIODS.P1_START.day),
          end:   annualEnd,
        };
      } else {
        return {
          start: new Date(year, PERIODS.P1_START.month, PERIODS.P1_START.day),
          end:   new Date(year + 1, PERIODS.P2_END.month, PERIODS.P2_END.day, 23, 59, 59),
        };
      }
    }
  }

  /**
   * Maps membership tier to health benefit.
   */
  private getHealthBenefit(tier: MemberTierType): HealthBenefit {
    switch (tier) {
      case MemberTierType.EMERALD:
      case MemberTierType.RUBY:
        return HealthBenefit.FIT;
      case MemberTierType.DIAMOND:
        return HealthBenefit.CLASSY;
      default:
        return HealthBenefit.NONE;
    }
  }
}

export const membershipService = new MembershipService();
