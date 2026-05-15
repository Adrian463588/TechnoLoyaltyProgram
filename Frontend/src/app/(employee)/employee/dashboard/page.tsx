import React from "react";
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DashboardContent } from "./dashboard-content";

/**
 * Fetches dashboard data from the real backend.
 * Returns safe fallback values if the backend is unavailable (graceful degradation).
 */
async function getDashboardData(token: string) {
  try {
    const summary = await employeeApi.getDashboard(token);
    return {
      tokenBalance:      summary.tokenSummary.totalTokens,
      tier:              summary.tokenSummary.currentTier,
      eligibilityStatus: { eligible: summary.tokenSummary.isEligibleForReward },
      period:            "P2: Jun 16 → Dec 15",  // TODO: derive from backend once endpoint exposes period
    };
  } catch {
    return {
      tokenBalance:      0,
      tier:              "SAPHIRE" as const,
      eligibilityStatus: { eligible: false },
      period:            "—",
    };
  }
}

export default async function DashboardPage() {
  await auth();
  const token = await getServerToken();
  const data = await getDashboardData(token);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <DashboardContent data={data} />
      </main>
    </div>
  );
}