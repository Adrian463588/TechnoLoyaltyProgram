/**
 * Backend/src/controllers/token-rule.controller.ts
 *
 * Controller for Token Conversion Rule endpoints.
 * SOLID — SRP: request parsing + response formatting only.
 */

import type { RequestHandler } from "express";
import { TokenRuleService } from "@/services/token-rule.service";
import { updateTokenRuleSchema } from "@/types/validations";

export const TokenRuleController = {
  /**
   * GET /api/admin/token-rules
   * Returns all conversion rules.
   */
  listRules: (async (_req, res, next) => {
    try {
      const rules = await TokenRuleService.getAllRules();
      res.json(
        rules.map((r) => ({
          id: r.id,
          divisionGroup: r.divisionGroup,
          tokensPerUnit: r.tokensPerUnit,
          label: r.label,
          updatedBy: r.updatedBy,
          updatedAt: r.updatedAt.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  /**
   * PATCH /api/admin/token-rules/:id
   * Updates the conversion rate for a specific rule.
   */
  updateRule: (async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsed = updateTokenRuleSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const actorId = req.user?.id;
      if (!actorId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const updated = await TokenRuleService.updateRule(
        id!,
        parsed.data.tokensPerUnit,
        actorId,
      );

      res.json({
        id: updated.id,
        divisionGroup: updated.divisionGroup,
        tokensPerUnit: updated.tokensPerUnit,
        label: updated.label,
        updatedBy: updated.updatedBy,
        updatedAt: updated.updatedAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
