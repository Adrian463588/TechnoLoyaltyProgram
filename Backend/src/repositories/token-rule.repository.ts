/**
 * Backend/src/repositories/token-rule.repository.ts
 *
 * Data access for TokenConversionRule.
 * SOLID — SRP: only DB operations, no business logic.
 */

import type { Prisma, TokenConversionRule } from "@prisma/client";
import { prisma } from "@/db/prisma";

async function findAll(): Promise<TokenConversionRule[]> {
  return prisma.tokenConversionRule.findMany({
    orderBy: { divisionGroup: "asc" },
  });
}

async function findByDivisionGroup(
  divisionGroup: string,
): Promise<TokenConversionRule | null> {
  return prisma.tokenConversionRule.findUnique({
    where: { divisionGroup },
  });
}

async function findById(id: string): Promise<TokenConversionRule | null> {
  return prisma.tokenConversionRule.findUnique({ where: { id } });
}

async function update(
  id: string,
  data: { tokensPerUnit: number; updatedBy: string },
  tx?: Prisma.TransactionClient,
): Promise<TokenConversionRule> {
  const client = tx ?? prisma;
  return client.tokenConversionRule.update({
    where: { id },
    data: {
      tokensPerUnit: data.tokensPerUnit,
      updatedBy: data.updatedBy,
    },
  });
}

export const tokenRuleRepository = {
  findAll,
  findByDivisionGroup,
  findById,
  update,
};
