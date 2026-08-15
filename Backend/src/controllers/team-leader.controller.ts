import { asyncHandler } from "@/middleware/asyncHandler";
import { ValidationError } from "@/errors";
import { uuidSchema } from "@/types/validations";
import { teamLeaderService } from "@/services/team-leader.service";

function parsePagination(query: Record<string, unknown>): { limit: number; offset: number } {
  const limit = Number(query["limit"] ?? 10);
  const offset = Number(query["offset"] ?? 0);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError("limit must be an integer between 1 and 100");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new ValidationError("offset must be a non-negative integer");
  }
  return { limit, offset };
}

export const TeamLeaderController = {
  getDashboard: asyncHandler(async (req, res) => {
    res.json(await teamLeaderService.getDashboard(req.user));
  }),

  getTeamSummary: asyncHandler(async (req, res) => {
    res.json(await teamLeaderService.getTeamSummary(req.user.id));
  }),

  getMemberDetail: asyncHandler(async (req, res) => {
    const memberId = uuidSchema.safeParse(req.params["memberId"]);
    if (!memberId.success) throw new ValidationError("Invalid member ID");

    const pagination = parsePagination(req.query);
    res.json(await teamLeaderService.getMemberDetail(req.user, memberId.data, pagination));
  }),
};
