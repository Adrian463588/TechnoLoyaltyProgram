/**
 * Backend/src/controllers/loyalty.controller.ts
 *
 * HTTP handlers for loyalty/dashboard endpoints.
 *
 * SOLID — SRP: reads session user, calls service, returns JSON.
 * No tier or token formulas live here.
 */

import type { RequestHandler } from "express";
import { LoyaltyCalculationService } from "@/services/loyalty-calculation.service";
import { ValidationError } from "@/errors/validation-error";
import { uuidSchema } from "@/types/validations";

export const LoyaltyController = {

  // GET /api/employee/dashboard
  getEmployeeDashboard: (async (req, res, next) => {
    try {
      const { user } = req;
      const data = await LoyaltyCalculationService.getEmployeeDashboard(user.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/employee/token-summary
  getTokenSummary: (async (req, res, next) => {
    try {
      const { user } = req;
      const data = await LoyaltyCalculationService.getTokenSummary(user.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/leader/team
  getTeamSummary: (async (req, res, next) => {
    try {
      const { user } = req;
      // ForbiddenError thrown by service if leader has no team
      const data = await LoyaltyCalculationService.getTeamSummary(user.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,

  // GET /api/leader/team/:memberId
  getTeamMemberDetail: (async (req, res, next) => {
    try {
      const { user } = req;

      // Validate memberId path parameter
      const memberIdParam = req.params["memberId"];
      const memberIdResult = uuidSchema.safeParse(memberIdParam);
      if (!memberIdResult.success) {
        throw new ValidationError("Invalid member ID format", { memberId: memberIdParam });
      }

      // Service enforces team membership — ForbiddenError if not in leader's team
      const data = await LoyaltyCalculationService.getTeamMemberDetail(
        user.id,
        memberIdResult.data,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
