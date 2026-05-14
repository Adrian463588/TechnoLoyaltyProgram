/**
 * Backend/src/api/leader.routes.ts
 *
 * Express router for TEAM_LEADER endpoints.
 * Accessible by TEAM_LEADER and HC_PM.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }      from "@/middleware/authenticate";
import { authorize }         from "@/middleware/authorize";
import { LoyaltyController } from "@/controllers/loyalty.controller";

export const leaderRoutes = Router();

leaderRoutes.use(authenticate, authorize("TEAM_LEADER", "HC_PM"));

// ── Team visibility ────────────────────────────────────────────────────────
leaderRoutes.get("/team",            LoyaltyController.getTeamSummary as RequestHandler);
leaderRoutes.get("/team/:memberId",  LoyaltyController.getTeamMemberDetail as RequestHandler);
