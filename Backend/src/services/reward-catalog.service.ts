/**
 * Backend/src/services/reward-catalog.service.ts
 *
 * Manages HC-owned reward catalog lifecycle.
 * PRD: HC-02 — create, edit, deactivate reward items.
 *
 * SOLID — SRP: catalog management only.
 * AGENTS.md: Audit log required for create/edit/deactivate.
 */

import { prisma } from "@/db/prisma";
import { logAudit } from "./audit.service";
import { NotFoundError, ValidationError } from "@/errors/index";
import { CacheService } from "./cache.service";
import { cacheInvalidationService } from "@/utils/cache/cache-invalidation.service";
import { CacheKeys } from "@/utils/cache/cache-key.registry";
import type { RewardItem, MemberTierType } from "@prisma/client";

export interface CreateRewardInput {
  name:         string;
  description?: string | undefined;
  tokenCost:    number;
  minTier?:     MemberTierType | undefined;
  imageUrl?:    string | undefined;
  category?:    string | undefined;
  stock?:       number | null | undefined;
}

export interface UpdateRewardInput {
  name?:        string | undefined;
  description?: string | undefined;
  tokenCost?:   number | undefined;
  minTier?:     MemberTierType | undefined;
  imageUrl?:    string | undefined;
  category?:    string | undefined;
  stock?:       number | null | undefined;
}

export class RewardCatalogService {
  /** List all rewards (active only by default). */
  async listAll(includeInactive = false): Promise<RewardItem[]> {
    const cacheKey = includeInactive 
      ? CacheKeys.rewardCatalogAdmin() 
      : CacheKeys.rewardCatalogActive();

    return CacheService.getWithFallback<RewardItem[]>(cacheKey, async () => {
      return prisma.rewardItem.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    });
  }

  /** Get a single reward by ID. Throws NotFoundError if missing. */
  async getById(id: string): Promise<RewardItem> {
    const item = await prisma.rewardItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError("RewardItem", id);
    return item;
  }

  /** Create a new reward item. HC actor required. */
  async create(input: CreateRewardInput, actorId: string): Promise<RewardItem> {
    if (input.tokenCost <= 0) {
      throw new ValidationError("tokenCost must be a positive integer.");
    }

    const item = await prisma.rewardItem.create({
      data: {
        name:        input.name,
        description: input.description ?? null,
        tokenCost:   input.tokenCost,
        minTier:     input.minTier ?? "SAPHIRE",
        imageUrl:    input.imageUrl ?? null,
        category:    input.category ?? null,
        stock:       input.stock ?? null,
        createdBy:   actorId,
        isActive:    true,
      },
    });

    await logAudit({
      action:    "REWARD_CREATED",
      actorId,
      targetType: "RewardItem",
      targetId:  item.id,
      newValue:  { name: item.name, tokenCost: item.tokenCost },
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_CATALOG_MUTATED" });

    return item;
  }

  /** Update reward item fields. HC actor required. */
  async update(id: string, input: UpdateRewardInput, actorId: string): Promise<RewardItem> {
    const existing = await this.getById(id);

    if (input.tokenCost !== undefined && input.tokenCost <= 0) {
      throw new ValidationError("tokenCost must be a positive integer.");
    }

    // Strip undefined values — Prisma update with exactOptionalPropertyTypes requires clean objects
    const cleanInput = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );

    const updated = await prisma.rewardItem.update({
      where: { id },
      data:  cleanInput,
    });

    await logAudit({
      action:        "REWARD_UPDATED",
      actorId,
      targetType:    "RewardItem",
      targetId:      id,
      previousValue: { name: existing.name, tokenCost: existing.tokenCost, stock: existing.stock },
      newValue:      { ...input },
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_CATALOG_MUTATED" });

    return updated;
  }

  /**
   * Deactivate a reward item.
   */
  async deactivate(id: string, actorId: string): Promise<RewardItem> {
    return this.toggleStatus(id, false, actorId);
  }

  /**
   * Toggle reward active status
   */
  async toggleStatus(id: string, active: boolean, actorId: string): Promise<RewardItem> {
    const existing = await this.getById(id);

    const updated = await prisma.rewardItem.update({
      where: { id },
      data:  { isActive: active },
    });

    await logAudit({
      action:        active ? "REWARD_ACTIVATED" : "REWARD_DEACTIVATED",
      actorId,
      targetType:    "RewardItem",
      targetId:      id,
      previousValue: { isActive: existing.isActive },
      newValue:      { isActive: active },
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_CATALOG_MUTATED" });

    return updated;
  }

  /**
   * Permanently delete a reward item.
   * Only allowed if no redemption requests reference it.
   */
  async delete(id: string, actorId: string): Promise<void> {
    const existing = await this.getById(id);

    // Check if redemptions exist
    const count = await prisma.redemptionRequest.count({
      where: { rewardItemId: id }
    });

    if (count > 0) {
      throw new ValidationError(`Cannot delete reward "${existing.name}" because it has ${count} existing redemption requests. Deactivate it instead.`);
    }

    await prisma.rewardItem.delete({
      where: { id }
    });

    await logAudit({
      action:        "REWARD_DELETED",
      actorId,
      targetType:    "RewardItem",
      targetId:      id,
      previousValue: { name: existing.name },
      newValue:      {},
    });

    await cacheInvalidationService.invalidateAfterCommit({ type: "REWARD_CATALOG_MUTATED" });
  }
}

export const rewardCatalogService = new RewardCatalogService();
