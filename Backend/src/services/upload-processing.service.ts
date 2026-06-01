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
          const totalSlotStr = String(row["total_slot"] ?? row["total_slot_reguler"] ?? "0");
          const slots = parseInt(totalSlotStr, 10);

          // OVERWRITE LOGIC: Get target tokens from the remapped row
          const tokenVal = row["token"];
          let targetTokens = 0;
          if (tokenVal !== undefined && tokenVal !== null && tokenVal !== "") {
            targetTokens = Number(tokenVal) || 0;
          } else {
            // Fallback for security
            targetTokens = 0;
          }

          // Calculate current balance to determine delta
          const currentBalance = await tokenLedgerRepository.getBalance(user.id, tx);
          const delta = targetTokens - currentBalance;

          // Only create event if there's a change
          if (delta !== 0 || targetTokens === 0) {
            const isReset = targetTokens === 0 && currentBalance > 0;
            
            // Create ShiftClaim for history record
            const claim = await tx.shiftClaim.create({
              data: {
                mitraId: user.id,
                slotCount: 0, // In overwrite mode, slots are informational if available
                shiftDate: new Date(), 
                status: "APPROVED",
                validatedBy: actorId,
                validatedAt: new Date(),
              },
            });

            await tokenLedgerRepository.appendTokenEvent({
              userId: user.id,
              eventType: isReset ? TokenEventType.RESET_PENALTY : TokenEventType.MANUAL_ADJUSTMENT,
              amount: delta,
              reason: isReset ? "Reset Token (Hasil evaluasi terbaru)" : `Sinkronisasi balance Excel (Target: ${targetTokens})`,
              performedBy: actorId,
              referenceId: claim.id,
              earnedYear: new Date().getFullYear(),
            }, tx);
          }

          // TIER OVERWRITE LOGIC
          const excelTierRaw = String(row["tier"] || "").toUpperCase().trim();
          const tierMap: Record<string, MemberTierType> = {
            SAPHIRE: MemberTierType.SAPHIRE,
            EMERALD: MemberTierType.EMERALD,
            RUBY: MemberTierType.RUBY,
            DIAMOND: MemberTierType.DIAMOND,
            SAPPHIRE: MemberTierType.SAPHIRE, 
          };

          const targetTier = tierMap[excelTierRaw];
          if (targetTier && targetTier !== user.membershipTier) {
            // Update Tier and log history
            const balanceNow = await tokenLedgerRepository.getBalance(user.id, tx);
            
            await tx.membershipHistory.create({
              data: {
                userId: user.id,
                previousTier: user.membershipTier,
                newTier: targetTier,
                changeReason: "MANUAL: Sinkronisasi Tier Excel (Hasil evaluasi terbaru)",
                triggeredBy: actorId,
                tokenBalanceBefore: balanceNow,
                tokenBalanceAfter: balanceNow,
              },
            });

            await tx.user.update({
              where: { id: user.id },
              data: { membershipTier: targetTier },
            });

            await logAudit({
              action: "TIER_SYNC_EXCEL",
              actorId,
              targetType: "User",
              targetId: user.id,
              previousValue: { tier: user.membershipTier },
              newValue: { tier: targetTier },
              tx,
            });
          }

          createdCount++;
        } else if (division === DivisionType.TECHNO) {
          // ... (existing TECHNO logic)
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
