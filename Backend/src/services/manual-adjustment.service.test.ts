import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManualAdjustmentService } from "./manual-adjustment.service";
import { prisma } from "../db/prisma";
import { tokenLedgerRepository } from "../repositories/token-ledger.repository";
import { logAudit } from "./audit.service";
import { ValidationError, NotFoundError } from "../errors/index";

// Mock dependencies
vi.mock("../db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../repositories/token-ledger.repository", () => ({
  tokenLedgerRepository: {
    getBalance: vi.fn(),
    appendTokenEvent: vi.fn(),
  },
}));

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(),
}));

describe("ManualAdjustmentService", () => {
  let service: ManualAdjustmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ManualAdjustmentService();
    
    // Default mock for $transaction to just execute the callback
    vi.mocked(prisma.$transaction).mockImplementation((cb: any) => cb(prisma));
  });

  it("throws ValidationError if amount is 0", async () => {
    await expect(
      service.adjustTokens("user-1", 0, "reason", "admin-1")
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError if reason is empty", async () => {
    await expect(
      service.adjustTokens("user-1", 100, "   ", "admin-1")
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError if user does not exist", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(
      service.adjustTokens("user-1", 100, "reason", "admin-1")
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError if balance becomes negative", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(50);

    await expect(
      service.adjustTokens("user-1", -100, "reason", "admin-1")
    ).rejects.toThrow(ValidationError);
  });

  it("successfully adjusts tokens and logs audit", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(tokenLedgerRepository.getBalance).mockResolvedValue(50);
    vi.mocked(tokenLedgerRepository.appendTokenEvent).mockResolvedValue({ id: "event-1" } as any);

    const result = await service.adjustTokens("user-1", 100, "Good job", "admin-1");

    expect(result).toBeDefined();
    expect(tokenLedgerRepository.appendTokenEvent).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalled();
  });
});
