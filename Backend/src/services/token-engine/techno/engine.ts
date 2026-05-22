import { HealthBenefit, MemberTierType } from "@prisma/client";
import { TokenEngine, TierCalculationResult, PeriodInfo } from "../types";
import { LOYALTY_POLICIES } from "../../../policies/loyalty.policy";
import { TokenRuleService } from "@/services/token-rule.service";

export class TechnoTokenEngine implements TokenEngine {
  calculateTokens(projects: number): number {
    // Synchronous fallback — use hardcoded default
    return projects * LOYALTY_POLICIES.CONVERSION.TECHNO_PROJECT;
  }

  async calculateTokensAsync(projects: number): Promise<number> {
    const rate = await TokenRuleService.getConversionRate("TECHNO");
    return projects * rate;
  }

  calculateTier(cumulativeProjects: number): TierCalculationResult {
    const tier = LOYALTY_POLICIES.calculateTechnoTier(cumulativeProjects);
    const thresholds = LOYALTY_POLICIES.TECHNO_THRESHOLDS;
    const healthBenefit = this.getHealthBenefit(tier);
    const tierOrder = LOYALTY_POLICIES.TIER_ORDER;
    const currentIdx = tierOrder.indexOf(tier);
    
    const nextTier = currentIdx < tierOrder.length - 1 ? (tierOrder[currentIdx + 1] ?? null) : null;
    const pointsToNext = nextTier ? Math.max(0, thresholds[nextTier] - cumulativeProjects) : null;

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
  }
}
