/**
 * Backend/src/controllers/profile.controller.ts
 *
 * Thin controller for reading/updating user profile data.
 * AGENTS.md: no Prisma in controllers — delegates to service.
 */

import { asyncHandler } from "@/middleware/asyncHandler";
import { ProfileService } from "@/services/profile.service";

export const ProfileController = {
  // GET /api/employee/profile
  get: asyncHandler(async (req, res) => {
      const profile = await ProfileService.getProfile(req.user.id);
      res.json(profile);
  }),

  // PATCH /api/employee/profile
  update: asyncHandler(async (req, res) => {
      const updated = await ProfileService.updateProfile(req.user.id, req.body as { name?: string; email?: string });
      res.json(updated);
  }),

  // POST /api/employee/profile/change-password
  changePassword: asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      const result = await ProfileService.changePassword(req.user.id, currentPassword, newPassword);
      res.json(result);
  }),
};
