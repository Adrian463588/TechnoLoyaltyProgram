/**
 * Backend/src/services/evaluation.service.test.ts
 *
 * Unit tests for the EvaluationService.
 * Verifies idempotency and inactivity penalty logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evaluationService } from "./evaluation.service";
import { prisma } from "@/db/prisma";
import { PartnershipStatus, DivisionType } from "@prisma/client";

vi.mock("@/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    shiftClaim: {
      count: vi.fn(),
    },
    tokenLedger: {
      create: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    membershipHistory: {
      create: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/repositories/token-ledger.repository", () => ({
  tokenLedgerRepository: {
    getBalance: vi.fn(),
  },
}));

describe("EvaluationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should skip evaluation if already run this month", async () => {
    // Mock that an audit log for this month exists
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: "existing-log" } as any);

    const result = await evaluationService.runMonthlyMembershipEvaluation();

    expect((result as any).skipped).toBe(true);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("should identify and downgrade inactive users", async () => {
    // Set date to 2026-05-14 (as per session context)
    vi.setSystemTime(new Date(2026, 4, 14)); 

    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "user-1", partnerStatus: PartnershipStatus.ACTIVE, division: DivisionType.OPCENT, membershipTier: "EMERALD" }
    ] as any);
    
    // Mock zero approved claims for last 3 months but 1 total attempt to trigger DOWNGRADE instead of RESET
    vi.mocked(prisma.shiftClaim.count).mockImplementation((args) => {
      // If status: "APPROVED" is in where, return 0. Otherwise return 1.
      const res = (args?.where as any)?.status === "APPROVED" ? 0 : 1;
      return Promise.resolve(res) as any;
    });
    
    // Mock user has 1000 tokens
    const { tokenLedgerRepository } = await import("@/repositories/token-ledger.repository");
    vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(1000);

    const result = await evaluationService.runMonthlyMembershipEvaluation();

    if ("skipped" in result && result.skipped) {
       throw new Error("Should not have skipped");
    }

    const data = result as { evaluated: number; downgraded: number; reset: number; skipped: number };
    expect(data.evaluated).toBe(1);
    expect(data.downgraded).toBe(1);
    expect(data.reset).toBe(0);
    expect(prisma.tokenLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: -500 // 50% of 1000
      })
    }));
  });
});
