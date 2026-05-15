/**
 * Backend/src/services/evaluation.service.test.ts
 *
 * Unit tests for the EvaluationService.
 * Verifies idempotency (JobRun guard) and inactivity penalty logic.
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
    // JobRun guard (Sprint 2.1 idempotency)
    jobRun: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/repositories/token-ledger.repository", () => ({
  tokenLedgerRepository: {
    getBalance: vi.fn(),
    appendTokenEvent: vi.fn(),
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

  it("should skip evaluation if JobRun already exists for this period", async () => {
    // Mock that a JobRun record already exists for this month
    vi.mocked(prisma.jobRun.findUnique).mockResolvedValue({
      id: "existing-run",
      jobName: "membership-evaluation",
      periodKey: "2026-05",
      status: "SUCCESS",
    } as any);

    const result = await evaluationService.runMonthlyMembershipEvaluation();

    expect((result as any).skipped).toBe(true);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.jobRun.create).not.toHaveBeenCalled();
  });

  it("should identify and downgrade inactive users", async () => {
    // Set date to 2026-05-14
    vi.setSystemTime(new Date(2026, 4, 14));

    // No existing JobRun → allow execution
    vi.mocked(prisma.jobRun.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.jobRun.create).mockResolvedValue({ id: "new-run-id" } as any);
    vi.mocked(prisma.jobRun.update).mockResolvedValue({} as any);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "user-1", partnerStatus: PartnershipStatus.ACTIVE, division: DivisionType.OPCENT, membershipTier: "EMERALD" }
    ] as any);

    // Zero approved claims → inactiveMonths = 3; 1 total attempt → DOWNGRADE, not RESET
    vi.mocked(prisma.shiftClaim.count).mockImplementation((args) => {
      const res = (args?.where as any)?.status === "APPROVED" ? 0 : 1;
      return Promise.resolve(res) as any;
    });

    const { tokenLedgerRepository } = await import("@/repositories/token-ledger.repository");
    vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(1000);
    vi.mocked(tokenLedgerRepository.appendTokenEvent).mockResolvedValue({} as any);
    vi.mocked(prisma.membershipHistory.create).mockResolvedValue({} as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const result = await evaluationService.runMonthlyMembershipEvaluation();

    if ("skipped" in result && result.skipped) {
      throw new Error("Should not have skipped");
    }

    const data = result as { evaluated: number; downgraded: number; reset: number; skipped: number };
    expect(data.evaluated).toBe(1);
    expect(data.downgraded).toBe(1);
    expect(data.reset).toBe(0);

    // Verify appendTokenEvent was called with negative 50% penalty amount
    expect(tokenLedgerRepository.appendTokenEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -500, // 50% of 1000
        eventType: "DOWNGRADE_PENALTY",
      }),
      expect.anything(), // tx
    );

    // Verify JobRun was finalized with SUCCESS
    expect(prisma.jobRun.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "SUCCESS" }),
    }));
  });

  it("should mark JobRun as FAILED if an error is thrown", async () => {
    vi.setSystemTime(new Date(2026, 4, 14));

    vi.mocked(prisma.jobRun.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.jobRun.create).mockResolvedValue({ id: "error-run-id" } as any);
    vi.mocked(prisma.jobRun.update).mockResolvedValue({} as any);

    // Force an error during user lookup
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("DB connection failed"));

    await expect(evaluationService.runMonthlyMembershipEvaluation()).rejects.toThrow("DB connection failed");

    expect(prisma.jobRun.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "FAILED" }),
    }));
  });
});
