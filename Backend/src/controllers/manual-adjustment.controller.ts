/**
 * Backend/src/controllers/manual-adjustment.controller.ts
 *
 * HTTP handler for HC manual token adjustments.
 * Thin controller — Zod validates, service executes.
 *
 * SOLID — SRP: HTTP only.
 * AGENTS.md: Audit logging is in the service, not here.
 */

import type { RequestHandler } from "express";
import { z } from "zod";
import { manualAdjustmentService } from "@/services/manual-adjustment.service";
import { ValidationError } from "@/errors/index";

const adjustmentSchema = z.object({
  mitraId: z.string().min(1),
  amount: z.number().int().refine((n) => n !== 0, { message: "Amount cannot be zero" }),
  reason: z.string().min(1).max(500),
});

export const ManualAdjustmentController = {

  /** POST /api/admin/adjustments */
  adjust: (async (req, res, next) => {
    try {
      const { user } = req;
      const parsed = adjustmentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid adjustment payload", z.treeifyError(parsed.error));
      }

      const entry = await manualAdjustmentService.adjustTokens(
        parsed.data.mitraId,
        parsed.data.amount,
        parsed.data.reason,
        user.id,
      );

      res.status(201).json({
        success: true,
        message: `Tokens adjusted by ${String(parsed.data.amount)}`,
        ledgerEntryId: entry.id,
        entry,
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
