"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/auth";
import { adminApi, type RewardCatalogItem } from "@/lib/api-client";

/** Fetch all reward catalog items (including inactive) */
export async function fetchRewardsAction(): Promise<RewardCatalogItem[]> {
  const token = await getServerToken();
  if (!token) throw new Error("Unauthorized");

  return adminApi.listRewards(token);
}

/** Create a new reward item */
export async function createRewardAction(payload: {
  name: string;
  description: string;
  tokenCost: number;
  minTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  stock?: number | null;
  imageUrl?: string;
}): Promise<RewardCatalogItem> {
  const token = await getServerToken();
  if (!token) throw new Error("Unauthorized");

  const result = await adminApi.createReward(token, payload as any);
  revalidatePath("/admin/reward-catalog");
  return result;
}

/** Update an existing reward item */
export async function updateRewardAction(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    tokenCost: number;
    minTier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
    stock: number | null;
    imageUrl: string;
    isActive: boolean;
  }>
): Promise<RewardCatalogItem> {
  const token = await getServerToken();
  if (!token) throw new Error("Unauthorized");

  const result = await adminApi.updateReward(token, id, payload as any);
  revalidatePath("/admin/reward-catalog");
  return result;
}

/** Toggle a reward item active/inactive status */
export async function toggleRewardStatusAction(id: string, active: boolean): Promise<RewardCatalogItem> {
  const token = await getServerToken();
  if (!token) throw new Error("Unauthorized");

  const result = await adminApi.toggleRewardStatus(token, id, active);
  revalidatePath("/admin/reward-catalog");
  return result.item;
}

/** Permanently delete a reward item */
export async function deleteRewardAction(id: string): Promise<void> {
  const token = await getServerToken();
  if (!token) throw new Error("Unauthorized");

  await adminApi.deleteReward(token, id);
  revalidatePath("/admin/reward-catalog");
}
