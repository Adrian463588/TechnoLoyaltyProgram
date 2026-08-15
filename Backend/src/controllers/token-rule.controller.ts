import { asyncHandler } from "@/middleware/asyncHandler";
import { z } from "zod";
import { DivisionEnum, updateTokenRuleSchema } from "@/types/validations";
import { ValidationError } from "@/errors";
import { tokenRuleService } from "@/services/token-rule.service";

const requestSchema = updateTokenRuleSchema.extend({ division: DivisionEnum });

export const TokenRuleController = {
  list: asyncHandler(async (_req, res) => {
    res.json(await tokenRuleService.list());
  }),
  update: asyncHandler(async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError("Invalid token rule", z.treeifyError(parsed.error));
    const updated = await tokenRuleService.update(parsed.data.division, parsed.data.tokensPerUnit, req.user.id);
    res.json(updated);
  }),
};
