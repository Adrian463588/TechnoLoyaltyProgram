"use server";

/**
 * features/leader/actions.ts
 * Server Actions for Team Leader mutations (TL-01).
 * RBAC: TEAM_LEADER role only.
 */

import { auth, getServerToken } from "@/lib/auth";
import { leaderApi } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function confirmPartnerStatus(
  confirmationId: string,
  confirmedStatus: "ACTIVE" | "RESIGNED",
  note?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session || session.user?.role !== "TEAM_LEADER") {
    return { success: false, error: "Unauthorized" };
  }

  const token = await getServerToken();
  try {
    await leaderApi.confirmPartnerStatus(token, confirmationId, {
      confirmedStatus,
      note,
    });

    // Revalidate the pending confirmations list so the UI reflects the change
    revalidatePath("/leader/alerts");
    revalidatePath("/leader/team");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to confirm partner status",
    };
  }
}

export async function getPendingConfirmations() {
  const session = await auth();
  if (!session || session.user?.role !== "TEAM_LEADER") return [];

  const token = await getServerToken();
  try {
    return await leaderApi.listPendingConfirmations(token);
  } catch {
    return [];
  }
}
