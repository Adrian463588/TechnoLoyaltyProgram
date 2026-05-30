import React from "react";
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, adminApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DashboardContent } from "./dashboard-content";

/**
 * Fetches dashboard data from the real backend.
 */
async function getDashboardData(token: string) {
  try {
    const [summary, settings] = await Promise.all([
      employeeApi.getDashboard(token),
      adminApi.getSystemSettings(token).catch(() => null),
    ]);

    return {
      tokenBalance:      summary.tokenSummary.totalTokens,
      tier:              summary.user.membershipTier,
      eligibilityStatus: { eligible: summary.tokenSummary.isEligibleForReward },
      period:            "—",
      recentTransactions: summary.recentTransactions,
      settings:          settings,
    };
  } catch {
    return {
      tokenBalance:      0,
      tier:              "SAPHIRE" as const,
      eligibilityStatus: { eligible: false },
      period:            "—",
      settings:          null,
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const token = await getServerToken();
  const data = await getDashboardData(token);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        <DashboardContent 
          data={data as any} 
          userName={session?.user?.name || "Member"} 
        />
      </div>
    </div>
  );
}
