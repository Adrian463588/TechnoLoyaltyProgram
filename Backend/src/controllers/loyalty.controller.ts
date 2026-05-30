/**
 * Backend/src/controllers/loyalty.controller.ts
 *
 * HTTP handlers for loyalty/dashboard endpoints.
 *
 * SOLID — SRP: reads session user, calls service, returns JSON.
 * No tier or token formulas live here.
 */

import { asyncHandler } from "@/middleware/asyncHandler";
import { LoyaltyCalculationService } from "@/services/loyalty-calculation.service";
import { TokenLedgerRepository }     from "@/repositories/token-ledger.repository";

export const LoyaltyController = {

  // GET /api/employee/dashboard
  getEmployeeDashboard: asyncHandler(async (req, res) => {
      const { user } = req;
      const data = await LoyaltyCalculationService.getEmployeeDashboard(user.id);
      res.json(data);
  }),

  // GET /api/employee/token-summary
  getTokenSummary: asyncHandler(async (req, res) => {
      const { user } = req;
      const data = await LoyaltyCalculationService.getTokenSummary(user.id);
      res.json(data);
  }),

  // GET /api/employee/history?limit=&offset=
  getTokenHistory: asyncHandler(async (req, res) => {
      const { user } = req;
      const limit  = Math.min(Number(req.query["limit"]  ?? 50), 100);
      const offset = Number(req.query["offset"] ?? 0);
      const repo   = new TokenLedgerRepository();
      
      const [entries, total] = await Promise.all([
        repo.getHistory(user.id, limit, offset),
        repo.countHistory(user.id)
      ]);

      res.json({ entries, limit, offset, total });
  }),
};
