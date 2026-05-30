/**
 * Backend/src/controllers/team-leader.controller.ts
 *
 * HTTP handlers for Team Leader views.
 * PRD TL-02: team token/membership summary.
 * PRD TL-03: individual member token history.
 *
 * SOLID — SRP: HTTP only. Delegating to LoyaltyCalculationService.
 * AGENTS.md: TL can only see their own subordinates — RBAC enforced here.
 */

import { asyncHandler } from "@/middleware/asyncHandler";
import { prisma } from "@/db/prisma";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";
import { LoyaltyCalculationService } from "@/services/loyalty-calculation.service";
import { uuidSchema } from "@/types/validations";
import { NotFoundError, ValidationError, ForbiddenError } from "@/errors/index";
import { CacheService } from "@/services/cache.service";
import { CacheKeys } from "@/utils/cache/cache-key.registry";

export const TeamLeaderController = {

  /**
   * GET /api/leader/team
   * Returns summary of all subordinates for the current TL.
   * PRD TL-02
   */
  getTeamSummary: asyncHandler(async (req, res) => {
      const { user } = req;
      const cacheKey = CacheKeys.teamTokenSummary(user.id);
      
      const result = await CacheService.getWithFallback(cacheKey, async () => {
        const members = await prisma.user.findMany({
          where: {
            teamLeadId:    user.id,
            partnerStatus: { not: "RESIGNED" },
          },
          select: {
            id:            true,
            name:          true,
            npk:           true,
            division:      true,
            membershipTier: true,
            partnerStatus: true,
          },
          orderBy: { name: "asc" },
        });

        // Get current balance for each member
        const summaries = await Promise.all(
          members.map(async (m) => ({
            ...m,
            currentBalance: await tokenLedgerRepository.getBalance(m.id),
          })),
        );

        return { teamLeadId: user.id, members: summaries, count: summaries.length };
      });
      
      res.json(result);
  }),

  /**
   * GET /api/leader/team/:memberId
   * Returns token summary + recent history for a specific team member.
   * PRD TL-03. TL can only view their own subordinates.
   */
  getMemberDetail: asyncHandler(async (req, res) => {
      const { user } = req;
      const idResult = uuidSchema.safeParse(req.params["memberId"]);
      if (!idResult.success) throw new ValidationError("Invalid member ID", {});

      // RBAC: verify this member belongs to this TL
      const member = await prisma.user.findUnique({
        where: { id: idResult.data },
        select: {
          id:            true,
          name:          true,
          npk:           true,
          division:      true,
          membershipTier: true,
          partnerStatus: true,
          teamLeadId:    true,
        },
      });

      if (!member) throw new NotFoundError("User", idResult.data);

      // HC_PM can view any member; TEAM_LEADER only sees their subordinates
      if (user.role === "TEAM_LEADER" && member.teamLeadId !== user.id) {
        throw new ForbiddenError("You can only view your own team members.");
      }

      const tokenSummary = await LoyaltyCalculationService.getTokenSummary(member.id);
      
      const limit = Number(req.query["limit"]) || 10;
      const offset = Number(req.query["offset"]) || 0;

      const [history, total] = await Promise.all([
        tokenLedgerRepository.getHistory(member.id, limit, offset),
        prisma.tokenLedger.count({ where: { userId: member.id } })
      ]);

      res.json({
        member: {
          ...member,
          totalTokens: tokenSummary.totalTokens,
        },
        tokenSummary,
        ledger: history,
        total,
      });
  }),
};
