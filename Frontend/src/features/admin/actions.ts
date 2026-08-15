"use server";

/**
 * features/admin/actions.ts
 * Server Actions for Admin mutations (HC role only).
 * Keeps HTTP calls off the client, satisfying AGENTS.md RBAC rules.
 */

import { auth, getServerToken } from "@/lib/auth";
import { adminApi } from "@/lib/api-client";
import { randomUUID } from "node:crypto";

export async function submitManualAdjustment(payload: {
  mitraId: string;
  amount: number;
  reason: string;
}): Promise<{ success: true; ledgerEntryId: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session || session.user?.role !== "HC_PM") {
    return { success: false, error: "Unauthorized" };
  }

  const token = await getServerToken();
  try {
    const result = await adminApi.createManualAdjustment(token, {
      ...payload,
      idempotencyKey: randomUUID(),
    });
    return { success: true, ledgerEntryId: result.ledgerEntryId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Adjustment failed",
    };
  }
}
