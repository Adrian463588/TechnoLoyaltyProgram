/**
 * Backend/src/controllers/profile.controller.ts
 *
 * Thin controller for reading/updating user profile data.
 * AGENTS.md: no Prisma in controllers — delegates to service.
 */

import type { RequestHandler } from "express";
import { ProfileService } from "@/services/profile.service";

export const ProfileController = {
  // GET /api/employee/profile
  get: (async (req, res, next) => {
    try {
      const profile = await ProfileService.getProfile(req.user.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // PATCH /api/employee/profile
  update: (async (req, res, next) => {
    try {
      const updated = await ProfileService.updateProfile(req.user.id, req.body as { name?: string; email?: string });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
