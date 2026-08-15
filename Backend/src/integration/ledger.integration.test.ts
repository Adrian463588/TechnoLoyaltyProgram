import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TokenEventType } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { tokenLedgerRepository } from "@/repositories/token-ledger.repository";

describe("TokenLedger database contract", () => {
  let userId: string;
  let existingEntryId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.findFirst({ where: { role: "MITRA" }, select: { id: true } });
    if (!user) throw new Error("Integration database must contain at least one MITRA seed user.");
    userId = user.id;
    const entry = await prisma.tokenLedger.findFirst({ where: { userId }, select: { id: true } });
    existingEntryId = entry?.id ?? null;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("derives balance from SUM(amount) and rolls back test writes", async () => {
    const before = await tokenLedgerRepository.getBalance(userId);
    const marker = `integration:${randomUUID()}`;

    await expect(prisma.$transaction(async (tx) => {
      await tokenLedgerRepository.appendTokenEvent({
        userId,
        eventType: TokenEventType.MANUAL_ADJUSTMENT,
        amount: 1,
        reason: "Integration rollback probe",
        performedBy: userId,
        idempotencyKey: marker,
      }, tx);

      const aggregate = await tx.tokenLedger.aggregate({ where: { userId }, _sum: { amount: true } });
      expect(aggregate._sum.amount ?? 0).toBe(before + 1);
      expect(await tokenLedgerRepository.getBalance(userId, tx)).toBe(aggregate._sum.amount ?? 0);
      throw new Error("ROLLBACK_PROBE");
    })).rejects.toThrow("ROLLBACK_PROBE");

    expect(await tokenLedgerRepository.getBalance(userId)).toBe(before);
    expect(await prisma.tokenLedger.findUnique({ where: { idempotencyKey: marker } })).toBeNull();
  });

  it("rejects direct UPDATE and DELETE attempts at database level", async () => {
    if (!existingEntryId) throw new Error("Integration database must contain a ledger row for trigger verification.");
    const entryId = existingEntryId;
    await expect(prisma.$transaction((tx) => tx.$executeRaw`
      UPDATE "TokenLedger" SET "reason" = 'forbidden' WHERE "id" = ${entryId}
    `)).rejects.toThrow(/append-only/i);

    await expect(prisma.$transaction((tx) => tx.$executeRaw`
      DELETE FROM "TokenLedger" WHERE "id" = ${entryId}
    `)).rejects.toThrow(/append-only/i);
  });
});
