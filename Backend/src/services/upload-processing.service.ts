import { prisma } from "@/db/prisma";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { DivisionType, Prisma, TokenEventType } from "@prisma/client";
import { logAudit } from "./audit.service";
import { LOYALTY_POLICIES } from "@/policies/loyalty.policy";
import { ConflictError, NotFoundError, ValidationError } from "@/errors";

type UploadRow = Record<string, string | number | boolean | null>;

type UploadResult = { processed: number; created: number; skipped?: boolean };

function sourceUnitsFor(row: UploadRow, division: DivisionType): number {
  const keys = division === DivisionType.TECHNO
    ? ["sourceUnits", "completedProjects", "completed_projects", "projects", "sprints"]
    : ["sourceUnits", "slots", "slotCount", "total_slot", "total_slot_reguler", "accumulated_slots"];
  const key = keys.find((candidate) => row[candidate] !== null && row[candidate] !== undefined && row[candidate] !== "");
  if (!key) throw new ValidationError(`Source contribution is missing for row ${String(row["rowNumber"] ?? "unknown")}.`);
  const value = Number(row[key]);
  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError(`Source contribution must be a non-negative integer for row ${String(row["rowNumber"] ?? "unknown")}.`);
  }
  return value;
}

function conversionRate(division: DivisionType, configuredRate: number | undefined): number {
  if (configuredRate !== undefined) return configuredRate;
  return division === DivisionType.TECHNO
    ? LOYALTY_POLICIES.CONVERSION.TECHNO_PROJECT
    : LOYALTY_POLICIES.CONVERSION.OPCENT_TELE_SLOT;
}

export class UploadProcessingService {
  async processUploadBatch(
    division: DivisionType,
    rows: UploadRow[],
    actorId: string,
    idempotencyKey?: string,
  ): Promise<UploadResult> {
    return prisma.$transaction(async (tx) => {
      const jobName = "upload-commit";
      const periodKey = idempotencyKey ?? `non-idempotent-${Date.now()}`;

      if (idempotencyKey) {
        const existing = await tx.jobRun.findUnique({
          where: { jobName_periodKey: { jobName, periodKey } },
        });
        if (existing?.status === "SUCCESS") return { processed: 0, created: 0, skipped: true };
        if (existing?.status === "RUNNING") {
          throw new ConflictError("UPLOAD_COMMIT_IN_PROGRESS", "This upload commit is already being processed.");
        }
        if (existing) {
          await tx.jobRun.update({
            where: { id: existing.id },
            data: { status: "RUNNING", startedAt: new Date(), finishedAt: null, summary: Prisma.JsonNull },
          });
        } else {
          await tx.jobRun.create({ data: { jobName, periodKey, status: "RUNNING" } });
        }
      }

      const rule = await tx.tokenRule.findUnique({ where: { division } });
      const rate = conversionRate(division, rule?.tokensPerUnit);
      let processedCount = 0;
      let createdCount = 0;

      for (const [index, row] of rows.entries()) {
        const npk = String(row["npk"] ?? "").trim();
        if (!npk) continue;

        const user = await tx.user.findUnique({ where: { npk } });
        if (!user) throw new NotFoundError("User", npk);
        if (user.division !== division) {
          throw new ValidationError(`User ${npk} belongs to ${user.division}, not ${division}.`);
        }

        processedCount += 1;
        const sourceUnits = sourceUnitsFor(row, division);
        const amount = sourceUnits * rate;
        if (amount === 0) continue;

        const rowNumber = typeof row["rowNumber"] === "number" ? row["rowNumber"] : index + 1;
        const eventIdempotencyKey = idempotencyKey
          ? `upload:${idempotencyKey}:row:${rowNumber}:${user.id}`
          : undefined;
        const sourceLabel = division === DivisionType.TECHNO ? "validated project data" : "validated slot data";

        if (division === DivisionType.TECHNO) {
          const claim = await tx.projectClaim.create({
            data: {
              mitraId: user.id,
              projectName: `Upload ${idempotencyKey ?? "source"} row ${rowNumber}`,
              completedAt: new Date(),
              status: "APPROVED",
              validatedBy: actorId,
              validatedAt: new Date(),
            },
          });
          await tokenLedgerRepository.appendTokenEvent({
            userId: user.id,
            eventType: TokenEventType.EARNED_PROJECT,
            amount,
            referenceId: claim.id,
            earnedYear: new Date().getFullYear(),
            reason: `${sourceUnits} project unit(s) from ${sourceLabel}`,
            performedBy: actorId,
            ...(eventIdempotencyKey ? { idempotencyKey: eventIdempotencyKey } : {}),
          }, tx);
        } else {
          const claim = await tx.shiftClaim.create({
            data: {
              mitraId: user.id,
              slotCount: sourceUnits,
              shiftDate: new Date(),
              status: "APPROVED",
              validatedBy: actorId,
              validatedAt: new Date(),
            },
          });
          await tokenLedgerRepository.appendTokenEvent({
            userId: user.id,
            eventType: TokenEventType.EARNED_SHIFT,
            amount,
            referenceId: claim.id,
            earnedYear: new Date().getFullYear(),
            reason: `${sourceUnits} slot(s) from ${sourceLabel}`,
            performedBy: actorId,
            ...(eventIdempotencyKey ? { idempotencyKey: eventIdempotencyKey } : {}),
          }, tx);
        }

        createdCount += 1;
        await logAudit({
          action: "TOKEN_CREDITED",
          actorId,
          targetType: "User",
          targetId: user.id,
          newValue: { amount, sourceUnits, division, rowNumber, idempotencyKey: eventIdempotencyKey },
          tx,
        });
      }

      const result: UploadResult = { processed: processedCount, created: createdCount };
      await logAudit({
        action: "BULK_UPLOAD_COMMITTED",
        actorId,
        targetType: "System",
        targetId: idempotencyKey ?? "bulk-upload",
        newValue: { division, processedCount, createdCount, idempotencyKey },
        tx,
      });

      if (idempotencyKey) {
        await tx.jobRun.update({
          where: { jobName_periodKey: { jobName, periodKey } },
          data: { status: "SUCCESS", finishedAt: new Date(), summary: result },
        });
      }

      return result;
    });
  }
}

export const uploadProcessingService = new UploadProcessingService();
