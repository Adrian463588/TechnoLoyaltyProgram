import { prisma } from "@/db/prisma";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { DivisionType, MemberTierType, TokenEventType } from "@prisma/client";
import { logAudit } from "./audit.service";
import { membershipAdjustmentService } from "./membership-adjustment.service";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";
import { qualifiesForUpgrade } from "@/domain/membership/tier-engine.domain";

type UploadRow = Record<string, string | number | boolean | null>;

export class UploadProcessingService {
  async processUploadBatch(
    division: DivisionType,
    rows: UploadRow[],
    actorId: string
  ): Promise<{ processed: number; created: number }> {
    let processedCount = 0;
    let createdCount = 0;

    for (const row of rows) {
      const npk = String(row["npk"] ?? "");
      if (!npk) continue;

      const user = await prisma.user.findUnique({ where: { npk } });
      if (!user) continue; // Skip unknown users for now
      
      // Prevent cross-division data pollution
      if (user.division !== division) continue;

      processedCount++;

      await prisma.$transaction(async (tx) => {
        let tokensToCredit = 0;

        if (division === DivisionType.OPCENT || division === DivisionType.TELE) {
          // Parse slots
          // We look for 'total_slot' or fallback to a general value
          const totalSlotStr = String(row["total_slot"] ?? row["total_slot_reguler"] ?? "0");
          const slots = parseInt(totalSlotStr, 10);
          if (isNaN(slots) || slots <= 0) return;

          // Create ShiftClaim
          const claim = await tx.shiftClaim.create({
            data: {
              mitraId: user.id,
              slotCount: slots,
              shiftDate: new Date(), // Using current date for upload date
              status: "APPROVED",
              validatedBy: actorId,
              validatedAt: new Date(),
            },
          });

          tokensToCredit = slots * LOYALTY_POLICIES.CONVERSION.OPCENT_TELE_SLOT;

          // BUG-007 FIX: earnedYear is required so token-expiry job sets
          // expiresAt = Dec 31 of (earnedYear + 4). Without it, tokens never expire.
          await tokenLedgerRepository.appendTokenEvent({
            userId: user.id,
            eventType: TokenEventType.EARNED_SHIFT,
            amount: tokensToCredit,
            reason: `Bulk upload - Shift Claim (${slots} slots)`,
            performedBy: actorId,
            referenceId: claim.id,
            earnedYear: new Date().getFullYear(),
          }, tx);

          createdCount++;
        } else if (division === DivisionType.TECHNO) {
          // Parse sprints/projects
          // Let's find any column that starts with total_sprint
          let totalSprints = 0;
          let rejectionCount = 0;
          for (const key of Object.keys(row)) {
            if (key.includes("total_sprint") && typeof row[key] !== "object") {
               totalSprints += parseInt(String(row[key]), 10) || 0;
            }
            if (key.includes("penolakan") && typeof row[key] !== "object") {
               rejectionCount += parseInt(String(row[key]), 10) || 0;
            }
          }
          
          if (totalSprints <= 0 && rejectionCount <= 0) return;

          if (totalSprints > 0) {
            const claim = await tx.projectClaim.create({
              data: {
                mitraId: user.id,
                projectName: "Bulk Upload Sprint",
                completedAt: new Date(),
                status: "APPROVED",
                validatedBy: actorId,
                validatedAt: new Date(),
              },
            });

            tokensToCredit = totalSprints * LOYALTY_POLICIES.CONVERSION.TECHNO_PROJECT;

            // BUG-007 FIX: earnedYear is required so token-expiry job sets
            // expiresAt = Dec 31 of (earnedYear + 4). Without it, tokens never expire.
            await tokenLedgerRepository.appendTokenEvent({
              userId: user.id,
              eventType: TokenEventType.EARNED_PROJECT,
              amount: tokensToCredit,
              reason: `Bulk upload - Project Claim (${totalSprints} sprints)`,
              performedBy: actorId,
              referenceId: claim.id,
              earnedYear: new Date().getFullYear(),
            }, tx);
            createdCount++;
          }
          
          // Rejections are recorded as REJECTED claims for evaluation penalty
          for (let i = 0; i < rejectionCount; i++) {
            await tx.projectClaim.create({
              data: {
                mitraId: user.id,
                projectName: "Bulk Upload Rejection",
                completedAt: new Date(),
                status: "REJECTED",
                rejectionReason: "Reported in bulk upload",
                validatedBy: actorId,
                validatedAt: new Date(),
              },
            });
          }
        }

        if (tokensToCredit > 0) {
          // After token is credited, evaluate for upgrade!
          const currentBalance = await tokenLedgerRepository.getBalance(user.id, tx);
          const upgradeCheck = qualifiesForUpgrade(division, user.membershipTier, currentBalance);
          
          if (upgradeCheck.qualified && upgradeCheck.nextTier) {
            // We need to call upgrade! We will implement upgradeMembership in MembershipAdjustmentService
            await membershipAdjustmentService.upgradeMembership(user.id, upgradeCheck.nextTier, actorId, tx);
          }
        }
      });
    }

    // Log the whole batch
    await logAudit({
      action: "BULK_UPLOAD_COMMITTED",
      actorId,
      targetType: "System",
      targetId: "bulk-upload",
      newValue: { division, processedCount, createdCount },
    });

    return { processed: processedCount, created: createdCount };
  }
}

export const uploadProcessingService = new UploadProcessingService();
