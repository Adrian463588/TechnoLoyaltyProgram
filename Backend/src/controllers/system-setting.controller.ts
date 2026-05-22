/**
 * Backend/src/controllers/system-setting.controller.ts
 *
 * HTTP request handlers for global system settings.
 * Thin layer: parse → validate → call service → respond.
 */

import { type RequestHandler } from "express";
import { systemSettingService } from "@/services/system-setting.service";
import { z } from "zod";
import { ValidationError } from "@/errors";

// Regex for MM-DD format
const dateStrRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const updateSettingsSchema = z.object({
  p1Start: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  p1End: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  p2Start: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  p2End: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  claimP1Start: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  claimP1End: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  claimP2Start: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  claimP2End: z.string().regex(dateStrRegex, "Invalid format. Expected MM-DD").optional(),
  rewardPickupLocation: z.string().min(1, "Location is required").optional(),
});

export const SystemSettingController = {
  /**
   * GET /api/admin/system-settings
   */
  getSettings: (async (_req, res, next) => {
    try {
      const settings = await systemSettingService.getSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * PATCH /api/admin/system-settings
   */
  updateSettings: (async (req, res, next) => {
    try {
      const { user } = req as any;
      const result = updateSettingsSchema.safeParse(req.body);

      if (!result.success) {
        throw new ValidationError("Invalid input", result.error.flatten().fieldErrors);
      }

      const updated = await systemSettingService.updateSettings({
        ...result.data,
        updatedBy: user.id,
      } as any);

      res.json({
        success: true,
        settings: updated
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
