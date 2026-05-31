/**
 * Backend/src/api/leader.routes.ts
 *
 * Express router for TEAM_LEADER endpoints.
 * Accessible by TEAM_LEADER and HC_PM (HC can view all team data).
 *
 * SOLID — SRP: route definitions only.
 * PRD: TL-01, TL-02, TL-03.
 */

import { Router, type RequestHandler } from "express";
import { authenticate }                       from "@/middleware/authenticate";
import { authorize }                          from "@/middleware/authorize";
import { PartnerStatusConfirmationController } from "@/controllers/partner-status-confirmation.controller";
import { TeamLeaderController }               from "@/controllers/team-leader.controller";

export const leaderRoutes = Router();

leaderRoutes.use(authenticate, authorize("TEAM_LEADER", "HC_PM"));

// ── Partner Status Confirmations (TL-01) ─────────────────────────────────────
/**
 * @openapi
 * /api/leader/partner-confirmations:
 *   get:
 *     tags: [Leader]
 *     summary: List pending partner status confirmation requests for this leader
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List retrieved
 */
leaderRoutes.get(  "/partner-confirmations",              PartnerStatusConfirmationController.listForTL);

/**
 * @openapi
 * /api/leader/partner-confirmations/{id}/confirm:
 *   post:
 *     tags: [Leader]
 *     summary: Confirm or decline a partner status request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isConfirmed]
 *             properties:
 *               isConfirmed: { type: boolean, description: "True for ACTIVE, false for RESIGNED" }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Status confirmed/declined
 */
leaderRoutes.post( "/partner-confirmations/:id/confirm",  PartnerStatusConfirmationController.confirm);

// ── Team Summary (TL-02) ──────────────────────────────────────────────────────
/**
 * @openapi
 * /api/leader/team:
 *   get:
 *     tags: [Leader]
 *     summary: Get summary of tokens and membership for all team members
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Team summary retrieved
 */
leaderRoutes.get(  "/team",                               TeamLeaderController.getTeamSummary);

// ── Team Member Detail (TL-03) ───────────────────────────────────────────────
/**
 * @openapi
 * /api/leader/team/{memberId}:
 *   get:
 *     tags: [Leader]
 *     summary: Get detailed token history for a specific team member
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Member detail retrieved
 *       403:
 *         description: Forbidden (member is not in your team)
 */
leaderRoutes.get(  "/team/:memberId",                     TeamLeaderController.getMemberDetail);
