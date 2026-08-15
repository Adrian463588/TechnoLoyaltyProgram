export const dynamic = 'force-dynamic'

import React from "react";
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, adminApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DashboardContent, type DashboardData } from "./dashboard-content";

/**
 * Fetches dashboard data from the real backend.
 */
async function getDashboardData(token: string): Promise<DashboardData> {
  const [summary, settings] = await Promise.all([
    employeeApi.getDashboard(token),
    adminApi.getSystemSettings(token),
  ]);

  return {
    tokenBalance: summary.tokenSummary.totalTokens,
    tier: summary.user.membershipTier ?? summary.tokenSummary.currentTier,
    eligibilityStatus: {
      eligible: summary.tokenSummary.isEligibleForReward,
      reasons: summary.tokenSummary.eligibilityReasons ?? [],
      reason: summary.tokenSummary.eligibilityReasons?.[0],
    },
    period: summary.tokenSummary.periodEnd,
    recentTransactions: summary.recentTransactions,
    settings,
  };
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
          data={data}
          userName={session?.user?.name || "Member"} 
        />
      </div>
    </div>
  );
}
