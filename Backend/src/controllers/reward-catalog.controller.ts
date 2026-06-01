/**
 * Backend/src/controllers/reward-catalog.controller.ts
 *
 * HTTP handlers for reward catalog endpoints (HC only).
 * Thin layer: parse → validate → call service → respond.
 *
 * SOLID — SRP: only handles HTTP parsing/responding.
 */

import { asyncHandler } from "@/middleware/asyncHandler";
import { rewardCatalogService } from "@/services/reward-catalog.service";
import { z } from "zod";
import { uuidSchema } from "@/types/validations";
import { ValidationError } from "@/errors/index";

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const createRewardSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  tokenCost:   z.number().int().positive(),
  minTier:     z.enum(["SAPHIRE", "EMERALD", "RUBY", "DIAMOND"]).optional(),
  imageUrl:    z.string().url().or(z.literal("")).nullable().optional(),
  category:    z.string().max(100).optional(),
  stock:       z.number().int().nonnegative().nullable().optional(),
});

const updateRewardSchema = createRewardSchema.partial();

// ── Controller ────────────────────────────────────────────────────────────────

export const RewardCatalogController = {

  /** GET /api/admin/rewards — list all rewards (incl. inactive for HC) */
  listAll: asyncHandler(async (req, res) => {
      const includeInactive = req.query["includeInactive"] === "true";
      const items = await rewardCatalogService.listAll(includeInactive);
      res.json(items);
  }),

  /** GET /api/rewards — list active rewards (public, employee-facing) */
  listActive: asyncHandler(async (_req, res) => {
      const items = await rewardCatalogService.listAll(false);
      res.json(items);
  }),

  /** POST /api/admin/rewards — create reward */
  create: asyncHandler(async (req, res) => {
      const { user } = req;
      const parsed = createRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid reward data", z.treeifyError(parsed.error));
      }
      const item = await rewardCatalogService.create(parsed.data as any, user.id);
      res.status(201).json(item);
  }),

  /** PATCH /api/admin/rewards/:id — update reward fields */
  update: asyncHandler(async (req, res) => {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid reward ID", {});

      const parsed = updateRewardSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid reward data", z.treeifyError(parsed.error));

      const item = await rewardCatalogService.update(idResult.data, parsed.data as any, user.id);
      res.json(item);
  }),

  /** POST /api/admin/rewards/:id/toggle-status — toggle active/inactive */
  toggleStatus: asyncHandler(async (req, res) => {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid reward ID", {});

      const { active } = req.body;
      if (typeof active !== "boolean") throw new ValidationError("Missing 'active' boolean in body", {});

      const item = await rewardCatalogService.toggleStatus(idResult.data, active, user.id);
      res.json({ success: true, message: `Reward ${active ? 'activated' : 'deactivated'}`, item });
  }),

  /** DELETE /api/admin/rewards/:id — permanent delete (only if no redemptions) */
  delete: asyncHandler(async (req, res) => {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid reward ID", {});

      await rewardCatalogService.delete(idResult.data, user.id);
      res.json({ success: true, message: "Reward deleted permanently" });
  }),
};
