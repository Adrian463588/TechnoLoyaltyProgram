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

export interface CreateRewardInput {
  name:         string;
  description?: string | undefined;
  tokenCost:    number;
  imageUrl?:    string | undefined;
  category?:    string | undefined;
  stock?:       number | null | undefined;
}

export interface UpdateRewardInput {
  name?:        string | undefined;
  description?: string | undefined;
  tokenCost?:   number | undefined;
  imageUrl?:    string | undefined;
  category?:    string | undefined;
  stock?:       number | null | undefined;
}

export class RewardCatalogService {
  /** List all rewards (active only by default). */
  async listAll(includeInactive = false) {
    return prisma.rewardItem.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Get a single reward by ID. Throws NotFoundError if missing. */
  async getById(id: string) {
    const item = await prisma.rewardItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError("RewardItem", id);
    return item;
  }

  /** Create a new reward item. HC actor required. */
  async create(input: CreateRewardInput, actorId: string) {
    if (input.tokenCost <= 0) {
      throw new ValidationError("tokenCost must be a positive integer.");
    }

    const item = await prisma.rewardItem.create({
      data: {
        name:        input.name,
        description: input.description ?? null,
        tokenCost:   input.tokenCost,
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

    return item;
  }

  /** Update reward item fields. HC actor required. */
  async update(id: string, input: UpdateRewardInput, actorId: string) {
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

    return updated;
  }

  /**
   * Soft-deactivate a reward item.
   * Does NOT delete — existing redemptions reference it.
   */
  async deactivate(id: string, actorId: string) {
    const existing = await this.getById(id);

    if (!existing.isActive) {
      throw new ValidationError("Reward item is already inactive.");
    }

    const updated = await prisma.rewardItem.update({
      where: { id },
      data:  { isActive: false },
    });

    await logAudit({
      action:        "REWARD_DEACTIVATED",
      actorId,
      targetType:    "RewardItem",
      targetId:      id,
      previousValue: { isActive: true },
      newValue:      { isActive: false },
    });

    return updated;
  }
}

export const rewardCatalogService = new RewardCatalogService();
