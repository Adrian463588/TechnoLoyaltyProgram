/**
 * Backend/src/repositories/token-ledger.repository.test.ts
 *
 * Unit tests for the TokenLedgerRepository.
 * Verifies atomicity, balance snapshots, and negative balance rejection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tokenLedgerRepository } from "./token-ledger.repository";
import { prisma } from "@/db/prisma";
import { TokenEventType } from "@prisma/client";

vi.mock("@/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    // Row-lock query used inside appendTokenEvent
    $queryRaw: vi.fn().mockResolvedValue([]),
    tokenLedger: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("TokenLedgerRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate balanceAfter correctly on credit", async () => {
    // Mock previous balance of 100
    vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 100 } as any);
    
    // Mock create to return the created entry
    vi.mocked(prisma.tokenLedger.create).mockImplementation(({ data }) => Promise.resolve({ ...data, id: "new-id" } as any) as any);

    const result = await tokenLedgerRepository.appendTokenEvent({
      userId: "user-1",
      eventType: TokenEventType.EARNED_SHIFT,
      amount: 50,
      performedBy: "SYSTEM",
    });

    expect(result.balanceAfter).toBe(150);
    expect(prisma.tokenLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        balanceAfter: 150
      })
    }));
  });

  it("should reject if balance becomes negative", async () => {
    // Mock previous balance of 30
    vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 30 } as any);

    await expect(tokenLedgerRepository.appendTokenEvent({
      userId: "user-1",
      eventType: TokenEventType.REDEEMED,
      amount: -50, // More than 30
      performedBy: "user-1",
    })).rejects.toMatchObject({ code: "INSUFFICIENT_TOKENS" });
  });

  it("should set expiresAt automatically for earned tokens", async () => {
    vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tokenLedger.create).mockImplementation(({ data }) => Promise.resolve({ ...data } as any) as any);

    const result = await tokenLedgerRepository.appendTokenEvent({
      userId: "user-1",
      eventType: TokenEventType.EARNED_SHIFT,
      amount: 100,
      earnedYear: 2023,
      performedBy: "SYSTEM",
    });

    // 2023 + 3 = 2026, Dec 31
    expect(result.expiresAt?.getFullYear()).toBe(2026);
    expect(result.expiresAt?.getMonth()).toBe(11); // Dec
    expect(result.expiresAt?.getDate()).toBe(31);
  });
});
