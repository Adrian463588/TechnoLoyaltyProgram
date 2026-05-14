/**
 * Frontend/src/features/redemptions/actions.ts
 *
 * Next.js Server Actions for redemption workflows.
 * Enforces server-side validation, session checks, and Backend API orchestration.
 */

"use server";

import { auth } from "@/lib/auth";
import { getServerToken } from "@/lib/auth";
import { employeeApi, adminApi } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { redeemRequestSchema, updateStatusSchema, redemptionVerificationSchema } from "@/lib/validations";

/**
 * Mitra: Submit a new redemption request.
 */
export async function submitRedemptionRequest(formData: { rewardItemId: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MITRA") {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = redeemRequestSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Invalid reward item" };
  }

  try {
    const token = await getServerToken();
    await employeeApi.createRedemption(token, parsed.data.rewardItemId);
    
    revalidatePath("/employee/dashboard");
    revalidatePath("/employee/redemptions");
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to submit request" };
  }
}

/**
 * HC Admin: Approve/Reject redemption status.
 */
export async function updateRedemptionStatus(requestId: string, status: string, reason?: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "HC_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateStatusSchema.safeParse({ status, reason });
  if (!parsed.success) {
    return { success: false, error: "Invalid status or reason" };
  }

  try {
    const token = await getServerToken();
    await adminApi.updateRedemptionStatus(token, requestId, parsed.data.status, parsed.data.reason);
    
    revalidatePath("/admin/redemptions");
    revalidatePath(`/admin/redemptions/${requestId}`);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update status" };
  }
}

/**
 * HC Admin: Verify documents for pickup.
 */
export async function verifyRedemptionDocuments(requestId: string, verification: {
  idCardVerified: boolean;
  ktpVerified: boolean;
  npwpVerified: boolean;
  powerOfAttorneyVerified?: boolean;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "HC_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = redemptionVerificationSchema.safeParse(verification);
  if (!parsed.success) {
    return { success: false, error: "Invalid verification data" };
  }

  try {
    const token = await getServerToken();
    await adminApi.verifyRedemptionDocuments(token, requestId, parsed.data);
    
    revalidatePath(`/admin/redemptions/${requestId}`);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to verify documents" };
  }
}
