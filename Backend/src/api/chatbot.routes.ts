import { Router } from "express";
import { ChatbotController } from "@/controllers/chatbot.controller";
import { authenticate }    from "@/middleware/authenticate";

const router = Router();

/**
 * @route   POST /api/chatbot/execute-tool
 * @desc    Executes a specific database tool requested by the AI
 * @access  Private (Authenticated Users)
 */
router.post("/execute-tool", authenticate, ChatbotController.executeTool);

export default router;
