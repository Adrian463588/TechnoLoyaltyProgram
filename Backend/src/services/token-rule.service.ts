import { DivisionType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { logAudit } from "./audit.service";

export class TokenRuleService {
  async list(): Promise<Awaited<ReturnType<typeof prisma.tokenRule.findMany>>> {
    return prisma.tokenRule.findMany({ orderBy: { division: "asc" } });
  }

  async update(
    division: DivisionType,
    tokensPerUnit: number,
    actorId: string,
  ): Promise<Awaited<ReturnType<typeof prisma.tokenRule.upsert>>> {
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.tokenRule.findUnique({ where: { division } });
      const updated = await tx.tokenRule.upsert({
        where: { division },
        create: { division, tokensPerUnit, updatedBy: actorId },
        update: { tokensPerUnit, updatedBy: actorId },
      });
      await logAudit({
        action: "TOKEN_RULE_UPDATED",
        actorId,
        targetType: "TokenRule",
        targetId: updated.id,
        ...(previous ? { previousValue: { division, tokensPerUnit: previous.tokensPerUnit } } : {}),
        newValue: { division, tokensPerUnit },
        tx,
      });
      return updated;
    });
    return result;
  }
}

export const tokenRuleService = new TokenRuleService();
