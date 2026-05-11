import { prisma } from "@/lib/db/prisma";
import { LOYALTY_POLICIES } from "../policies/loyalty.policy";
import { AuditService } from "./audit.service";

export class LoyaltyCalculationService {
  /**
   * Calculate and issue tokens for a user based on their division metrics.
   * Transactional: Ledger, DivisionMetric, and LoyaltyProfile are kept in sync.
   */
  static async issueTokensForPeriod(
    userId: string,
    periodId: string,
    divisionType: "OPTEL" | "TECHNO",
    rawMetrics: Record<string, number | string>,
    actorId: string,
    sourceId?: string
  ) {
    let earnedTokens = 0;

    // 1. Calculate tokens based on business rules
    if (divisionType === "OPTEL") {
      const slots = Number(rawMetrics.totalSlots ?? rawMetrics.slots ?? 0);
      earnedTokens = slots * LOYALTY_POLICIES.OPTEL_CONVERSION.PER_SLOT_VALUE;
    } else if (divisionType === "TECHNO") {
      const sprints = Number(rawMetrics.sprintBalance ?? 0);
      const rejections = Number(rawMetrics.projectRejections ?? 0);
      const effectiveSprints = Math.max(0, sprints - rejections);
      earnedTokens = effectiveSprints * LOYALTY_POLICIES.TECHNO_CONVERSION.PER_SPRINT_VALUE;
    }

    if (earnedTokens <= 0) {
      return { success: true, earnedTokens: 0 };
    }

    // 2. Perform Transactional Ledger + Profile + Metric Update
    const result = await prisma.$transaction(async (tx) => {
      // 2a. Create Ledger Entry
      const entry = await tx.tokenLedgerEntry.create({
        data: {
          userId,
          amount: earnedTokens,
          sourceType: divisionType === "OPTEL" ? "UPLOAD_OPTEL" : "UPLOAD_TECHNO",
          sourceId: sourceId ?? null,
          periodId,
        },
      });

      // 2b. Ensure UserLoyaltyProfile exists (upsert)
      const profile = await tx.userLoyaltyProfile.upsert({
        where: { userId },
        create: { userId, totalTokens: earnedTokens, remainingTokens: earnedTokens },
        update: {
          totalTokens: { increment: earnedTokens },
          remainingTokens: { increment: earnedTokens },
        },
      });

      // 2c. Re-evaluate tier
      const newTotalTokens = profile.totalTokens + earnedTokens;
      const newTier = LOYALTY_POLICIES.calculateTier(newTotalTokens);
      if (profile.currentTier !== newTier) {
        await tx.userLoyaltyProfile.update({
          where: { id: profile.id },
          data: {
            currentTier: newTier,
            isEligible: newTotalTokens >= LOYALTY_POLICIES.REDEMPTION_THRESHOLD,
          },
        });
      }

      // 2d. Upsert UserDivisionMetric
      const existingMetric = await tx.userDivisionMetric.findFirst({
        where: { profileId: profile.id, divisionType },
      });

      if (existingMetric) {
        await tx.userDivisionMetric.update({
          where: { id: existingMetric.id },
          data:
            divisionType === "OPTEL"
              ? {
                  totalSlots: { increment: Number(rawMetrics.totalSlots ?? rawMetrics.slots ?? 0) },
                  regularSlots: { increment: Number(rawMetrics.regularSlots ?? 0) },
                }
              : {
                  sprintBalance: { increment: Number(rawMetrics.sprintBalance ?? 0) },
                  projectRejections: { increment: Number(rawMetrics.projectRejections ?? 0) },
                },
        });
      } else {
        await tx.userDivisionMetric.create({
          data: {
            profileId: profile.id,
            divisionType,
            ...(divisionType === "OPTEL"
              ? {
                  totalSlots: Number(rawMetrics.totalSlots ?? rawMetrics.slots ?? 0),
                  regularSlots: Number(rawMetrics.regularSlots ?? 0),
                }
              : {
                  sprintBalance: Number(rawMetrics.sprintBalance ?? 0),
                  projectRejections: Number(rawMetrics.projectRejections ?? 0),
                }),
          },
        });
      }

      // 2e. Audit log
      await AuditService.log({
        action: "TOKENS_ISSUED",
        actorId,
        targetType: "TokenLedgerEntry",
        targetId: entry.id,
        details: { earnedTokens, divisionType, newTier },
        tx,
      });

      return { entry, profile };
    });

    return { success: true, earnedTokens, result };
  }
}
