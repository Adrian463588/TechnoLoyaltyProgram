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

/**
 * @openapi
 * /api/leader/team:
 *   get:
 *     tags:
 *       - Team Leader
 *     summary: List all team members and their token status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team summary retrieved
 *       403:
 *         description: Forbidden
 */
// leaderRoutes.get("/team",            LoyaltyController.getTeamSummary as RequestHandler);

/**
 * @openapi
 * /api/leader/team/{memberId}:
 *   get:
 *     tags:
 *       - Team Leader
 *     summary: Get detailed token history for a team member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member detail retrieved
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Member not found
 */
// leaderRoutes.get("/team/:memberId",  LoyaltyController.getTeamMemberDetail as RequestHandler);
