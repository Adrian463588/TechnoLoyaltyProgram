import type { RequestHandler } from "express";
import { chatbotService } from "@/services/chatbot.service";

/**
 * ChatbotController
 * Handles internal requests from the Frontend Chatbot API Route.
 */
export const ChatbotController = {
  // POST /api/chatbot/execute-tool
  executeTool: (async (req, res, next) => {
    try {
      const { toolName, args } = req.body;
      const { user } = req; // Injected by authentication middleware

      console.log(`[Chatbot Tool] Executing: ${toolName} for user: ${user.npk}`, args);

      let result: any = null;

      switch (toolName) {
        case "get_my_token_summary":
          result = await chatbotService.getUserSummary(user.npk);
          break;
        case "get_my_redemption_history":
          result = await chatbotService.getRedemptionHistory(user.npk, args?.limit);
          break;
        case "get_reward_catalog":
          result = await chatbotService.getRewardCatalog(args?.maxPrice, args?.category);
          break;
        case "get_reward_detail":
          result = await chatbotService.getRewardDetail(args?.rewardName);
          break;
        case "get_team_overview":
          if (user.role !== "TEAM_LEADER" && user.role !== "HC_PM") {
            return res.status(403).json({ error: "Unauthorized role for this tool" });
          }
          result = await chatbotService.getTeamOverview(user.division ?? "");
          break;
        case "get_token_leaderboard":
          if (user.role !== "TEAM_LEADER" && user.role !== "HC_PM") {
            return res.status(403).json({ error: "Unauthorized role for this tool" });
          }
          // Team Leader can only see their own division leaderboard if specified, 
          // or we default to their division if they don't specify and aren't HC_PM.
          const divisionFilter = user.role === "TEAM_LEADER" ? user.division : args?.division;
          result = await chatbotService.getTokenLeaderboard(args?.limit, divisionFilter);
          break;
        case "get_global_pending_actions":
          if (user.role !== "HC_PM") {
            return res.status(403).json({ error: "Unauthorized role for this tool" });
          }
          result = await chatbotService.getGlobalPendingActions();
          break;
        default:
          return res.status(400).json({ error: `Tool ${toolName} not recognized` });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }) satisfies RequestHandler,
};
