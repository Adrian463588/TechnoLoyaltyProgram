import React from "react";
import { auth, getServerToken } from "@/lib/auth";
import { leaderApi, adminApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DashboardContent } from "@/app/(portal)/(employee)/employee/dashboard/dashboard-content";

export default async function LeaderDashboardPage() {
  const session = await auth();
  const token = await getServerToken();

  const [leaderData, settings] = await Promise.all([
    leaderApi.getDashboard(token),
    adminApi.getSystemSettings(token).catch(() => null)
  ]);

  // Adapt backend response to DashboardContent props
  const dashboardData = {
    tokenBalance: leaderData.teamTotalTokens,
    tier: "SAPHIRE" as const, // Placeholder, Leader dashboard doesn't use personal tier card
    eligibilityStatus: { eligible: false },
    period: "—",
    settings: settings,
    teamTierDistribution: leaderData.teamTierDistribution,
    teamTotalTokens: leaderData.teamTotalTokens,
    teamRedemptions: leaderData.recentRedemptions.map(r => ({
      ...r,
      mitraName: r.mitra.name,
      division: r.mitra.division,
      rewardName: r.item.name,
      tokenCost: r.item.tokenCost,
      submittedAt: r.createdAt
    }))
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        <DashboardContent 
          data={dashboardData as any} 
          userName={session?.user?.name || "Leader"} 
        />
      </div>
    </div>
  );
}
