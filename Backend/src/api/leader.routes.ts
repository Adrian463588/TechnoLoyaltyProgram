/**
 * Backend/src/api/leader.routes.ts
 *
 * Express router for TEAM_LEADER endpoints.
 * Accessible by TEAM_LEADER and HC_PM.
 */

import { Router } from "express";
import { authenticate }      from "@/middleware/authenticate";
import { authorize }         from "@/middleware/authorize";
import { LoyaltyController } from "@/controllers/loyalty.controller";

export const leaderRoutes: Router = Router();

leaderRoutes.use(authenticate, authorize("TEAM_LEADER", "HC_PM"));

// ── Team visibility ────────────────────────────────────────────────────────
leaderRoutes.get("/team",        LoyaltyController.getTeamSummary);
leaderRoutes.get("/team/:memberId", LoyaltyController.getTeamMemberDetail);
