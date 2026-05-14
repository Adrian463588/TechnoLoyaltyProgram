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
};
