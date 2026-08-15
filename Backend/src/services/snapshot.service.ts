import { DivisionType, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { ConflictError } from "@/errors";
import { logAudit } from "./audit.service";

export interface CreateSnapshotInput {
  periodKey: string;
  division?: DivisionType | undefined;
  cutoffAt: Date;
  sourceHash?: string | undefined;
  payload: Record<string, unknown>;
  createdBy: string;
}

export class SnapshotService {
  async list(): Promise<Awaited<ReturnType<typeof prisma.periodSnapshot.findMany>>> {
    return prisma.periodSnapshot.findMany({ orderBy: { cutoffAt: "desc" } });
  }

  async create(input: CreateSnapshotInput): Promise<Awaited<ReturnType<typeof prisma.periodSnapshot.create>>> {
    const existing = await prisma.periodSnapshot.findFirst({
      where: { periodKey: input.periodKey, division: input.division ?? null },
    });
    if (existing) throw new ConflictError("SNAPSHOT_ALREADY_EXISTS", "A snapshot already exists for this period and division.");

    const snapshot = await prisma.$transaction(async (tx) => {
      const created = await tx.periodSnapshot.create({
        data: {
          periodKey: input.periodKey,
          division: input.division ?? null,
          cutoffAt: input.cutoffAt,
          sourceHash: input.sourceHash ?? null,
          payload: input.payload as Prisma.InputJsonValue,
          createdBy: input.createdBy,
        },
      });
      await logAudit({
        action: "SNAPSHOT_CREATED",
        actorId: input.createdBy,
        targetType: "PeriodSnapshot",
        targetId: created.id,
        newValue: { periodKey: input.periodKey, division: input.division ?? null, cutoffAt: input.cutoffAt.toISOString() },
        tx,
      });
      return created;
    });
    return snapshot;
  }
}

export const snapshotService = new SnapshotService();
