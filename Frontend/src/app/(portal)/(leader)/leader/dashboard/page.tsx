import React from "react";
import { auth, getServerToken } from "@/lib/auth";
import { leaderApi, adminApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DashboardContent, type DashboardData } from "@/app/(portal)/(employee)/employee/dashboard/dashboard-content";

export default async function LeaderDashboardPage() {
  const session = await auth();
  const token = await getServerToken();
  const userName = session?.user?.name || "Leader";

  const [leaderData, settings] = await Promise.all([
    leaderApi.getDashboard(token),
    adminApi.getSystemSettings(token),
  ]);

  // Adapt backend response to DashboardContent props
  const dashboardData: DashboardData = {
    tokenBalance: leaderData.teamTotalTokens,
    tier: "SAPHIRE" as const, // Placeholder, Leader dashboard doesn't use personal tier card
    eligibilityStatus: { eligible: false },
    period: "—",
    settings: settings,
    teamTierDistribution: leaderData.teamTierDistribution,
    teamTotalTokens: leaderData.teamTotalTokens,
    teamRedemptions: leaderData.recentRedemptions.map(r => ({
      id: r.id,
      status: r.status,
      mitraName: r.mitra.name,
      division: r.mitra.division,
      rewardName: r.item.name,
      tokenCost: r.item.tokenCost,
      submittedAt: r.createdAt,
    }))
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        <DashboardContent 
          data={dashboardData}
          userName={userName} 
          welcomeMessage={`Welcome back, ${userName}! Here's an overview of your team's loyalty status.`}
        />
      </div>
    </div>
  );
}
