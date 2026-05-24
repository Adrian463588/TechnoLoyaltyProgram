import { HealthBenefit, MemberTierType } from "@prisma/client";
import { TokenEngine, TierCalculationResult, PeriodInfo } from "../types";
import { LOYALTY_POLICIES } from "../../../policies/loyalty.policy";

export class OpcentTeleTokenEngine implements TokenEngine {
  calculateTokens(slots: number): number {
    // Synchronous fallback — use hardcoded default
    return slots * LOYALTY_POLICIES.CONVERSION.OPCENT_TELE_SLOT;
  }

  calculateTier(cumulativeSlots: number): TierCalculationResult {
    const tier = LOYALTY_POLICIES.calculateOpcentTeleTier(cumulativeSlots);
    const thresholds = LOYALTY_POLICIES.OPCENT_TELE_THRESHOLDS;
    const healthBenefit = this.getHealthBenefit(tier);
    const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
    const currentIdx = tierOrder.indexOf(tier);
    
    const nextTier = currentIdx < tierOrder.length - 1 ? (tierOrder[currentIdx + 1] ?? null) : null;
    const pointsToNext = nextTier ? Math.max(0, thresholds[nextTier] - cumulativeSlots) : null;

    return {
      tier,
      healthBenefit,
      threshold: thresholds[tier],
      nextTier,
      pointsToNext,
    };
  }

  getHealthBenefit(tier: MemberTierType): HealthBenefit {
    switch (tier) {
      case "EMERALD":
      case "RUBY":
        return HealthBenefit.FIT;
      case "DIAMOND":
        return HealthBenefit.CLASSY;
      default:
        return HealthBenefit.NONE;
    }
  }

  getCurrentPeriod(referenceDate: Date = new Date()): PeriodInfo {
    const year = referenceDate.getFullYear();
    const { PERIODS } = LOYALTY_POLICIES;

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

  isWithinEvaluationPeriod(referenceDate: Date = new Date()): boolean {
    const { start, end } = this.getCurrentPeriod(referenceDate);
    return referenceDate >= start && referenceDate <= end;
  }
}
