import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheService } from "./cache.service";
import { tokenLedgerRepository } from "../repositories/token-ledger.repository";
import { manualAdjustmentService } from "./manual-adjustment.service";
import { rewardCatalogService } from "./reward-catalog.service";
import { redemptionService } from "./redemption.service";
import { cacheInvalidationService } from "@/utils/cache/cache-invalidation.service";
import { prisma } from "@/db/prisma";

// Mock prisma and logAudit
vi.mock("@/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb(prisma)),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    tokenLedger: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    rewardItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    redemptionRequest: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    redemptionStatusHistory: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  }
}));

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(),
}));

describe("Cache Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use an in-memory map to simulate redis for these tests
    const mockCache = new Map<string, string>();
    vi.spyOn(CacheService, "get").mockImplementation((key) => {
      const val = mockCache.get(key);
      return Promise.resolve(val ? JSON.parse(val) : null);
    });
    vi.spyOn(CacheService, "set").mockImplementation((key, value) => {
      mockCache.set(key, JSON.stringify(value));
      return Promise.resolve();
    });
    vi.spyOn(CacheService, "del").mockImplementation((key) => {
      mockCache.delete(key);
      return Promise.resolve();
    });
    vi.spyOn(CacheService, "delByPattern").mockImplementation((pattern) => {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      for (const k of mockCache.keys()) {
        if (regex.test(k)) {
          mockCache.delete(k);
        }
      }
      return Promise.resolve();
    });
  });

  describe("Token Ledger Cache Integration", () => {
    it("should invalidate cache after token mutation", async () => {
      const userId = "test-user-1";
      const invalidateSpy = vi.spyOn(cacheInvalidationService, "invalidateAfterCommit").mockResolvedValue(undefined);

      vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 100 } as any);
      vi.mocked(prisma.tokenLedger.create).mockResolvedValue({} as any);
      vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: userId } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: userId } as any);

      await manualAdjustmentService.adjustTokens(userId, 50, "Test", "admin-1");

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "TOKEN_MUTATED", userId })
      );
    });

    it("should use cache for token balance fetch", async () => {
      const userId = "test-user-2";
      vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 200 } as any);

      // First call, should hit DB
      const bal1 = await tokenLedgerRepository.getBalance(userId);
      expect(bal1).toBe(200);

      // Change DB mock
      vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 300 } as any);

      // Second call, should hit cache
      const bal2 = await tokenLedgerRepository.getBalance(userId);
      expect(bal2).toBe(200);
    });
  });

  describe("Reward Catalog Cache Integration", () => {
    it("should use cache for active catalog", async () => {
      vi.mocked(prisma.rewardItem.findMany).mockResolvedValue([{ id: "item-1" }] as any);

      const items1 = await rewardCatalogService.listAll(false);
      expect(items1).toHaveLength(1);

      vi.mocked(prisma.rewardItem.findMany).mockResolvedValue([{ id: "item-1" }, { id: "item-2" }] as any);
      
      const items2 = await rewardCatalogService.listAll(false);
      // Still hits cache
      expect(items2).toHaveLength(1);
    });

    it("should invalidate catalog after deactivation", async () => {
      const invalidateSpy = vi.spyOn(cacheInvalidationService, "invalidateAfterCommit").mockResolvedValue(undefined);
      vi.mocked(prisma.rewardItem.findUnique).mockResolvedValue({ id: "item-1", isActive: true } as any);
      vi.mocked(prisma.rewardItem.update).mockResolvedValue({ id: "item-1", isActive: false } as any);

      await rewardCatalogService.deactivate("item-1", "admin-1");

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "REWARD_CATALOG_MUTATED" })
      );
    });
  });

  describe("Redemption Eligibility Cache Integration", () => {
    it("should cache eligibility preview", async () => {
      const userId = "eligible-user";
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ partnerStatus: "ACTIVE" } as any);
      vi.mocked(prisma.tokenLedger.findFirst).mockResolvedValue({ balanceAfter: 5000 } as any);

      const result1 = await redemptionService.getEligibilityPreview(userId);
      expect(result1.isEligible).toBe(true);

      // Change DB to fail
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ partnerStatus: "RESIGNED" } as any);
      
      // Should hit cache
      const result2 = await redemptionService.getEligibilityPreview(userId);
      expect(result2.isEligible).toBe(true);
    });
  });
});