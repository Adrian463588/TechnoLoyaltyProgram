/**
 * Backend/src/controllers/reward-catalog.controller.ts
 *
 * HTTP handlers for reward catalog endpoints (HC only).
 * Thin layer: parse → validate → call service → respond.
 *
 * SOLID — SRP: only handles HTTP parsing/responding.
 */

import type { RequestHandler } from "express";
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
  imageUrl:    z.url().optional(),
  category:    z.string().max(100).optional(),
  stock:       z.number().int().nonnegative().nullable().optional(),
});

const updateRewardSchema = createRewardSchema.partial();

// ── Controller ────────────────────────────────────────────────────────────────

export const RewardCatalogController = {

  /** GET /api/admin/rewards — list all rewards (incl. inactive for HC) */
  listAll: (async (req, res, next) => {
    try {
      const includeInactive = req.query["includeInactive"] === "true";
      const items = await rewardCatalogService.listAll(includeInactive);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /** GET /api/rewards — list active rewards (public, employee-facing) */
  listActive: (async (_req, res, next) => {
    try {
      const items = await rewardCatalogService.listAll(false);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /** POST /api/admin/rewards — create reward */
  create: (async (req, res, next) => {
    try {
      const { user } = req;
      const parsed = createRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid reward data", z.treeifyError(parsed.error));
      }
      const item = await rewardCatalogService.create(parsed.data, user.id);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /** PATCH /api/admin/rewards/:id — update reward fields */
  update: (async (req, res, next) => {
    try {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid reward ID", {});

      const parsed = updateRewardSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid reward data", z.treeifyError(parsed.error));

      const item = await rewardCatalogService.update(idResult.data, parsed.data, user.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /** DELETE /api/admin/rewards/:id — soft-deactivate */
  deactivate: (async (req, res, next) => {
    try {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["id"]);
      if (!idResult.success) throw new ValidationError("Invalid reward ID", {});

      const item = await rewardCatalogService.deactivate(idResult.data, user.id);
      res.json({ success: true, message: "Reward deactivated", item });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
