import { asyncHandler } from "@/middleware/asyncHandler";
import { z } from "zod";
import { DivisionEnum } from "@/types/validations";
import { ValidationError } from "@/errors";
import { snapshotService } from "@/services/snapshot.service";

const createSchema = z.object({
  periodKey: z.string().trim().min(1).max(40),
  division: DivisionEnum.optional(),
  cutoffAt: z.iso.datetime(),
  sourceHash: z.string().trim().min(1).max(128).optional(),
  payload: z.record(z.string(), z.unknown()),
});

export const SnapshotController = {
  list: asyncHandler(async (_req, res) => {
    res.json(await snapshotService.list());
  }),
  create: asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid snapshot", z.treeifyError(parsed.error));
    const snapshot = await snapshotService.create({
      ...parsed.data,
      cutoffAt: new Date(parsed.data.cutoffAt),
      createdBy: req.user.id,
    });
    res.status(201).json(snapshot);
  }),
};
