import { auth, getServerToken } from "@/lib/auth";
import { employeeApi } from "@/lib/api-client";
import RewardsClient from "./rewards-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";

export default async function RewardsPage() {
  await auth();
  const token = await getServerToken();

  // Fetch token summary and reward catalog from real backend in parallel
  const [summary, catalog] = await Promise.all([
    employeeApi.getTokenSummary(token).catch(() => null),
    employeeApi.getRewardCatalog(token).catch(() => []),
  ]);

  const userTokens = summary?.totalTokens ?? 0;
  const isEligible = summary?.isEligibleForReward ?? false;

  // Map backend DTO to the local RewardItem shape expected by RewardsClient
  const rewards = catalog.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    tokenCost: r.tokenCost,
    // Backend does not yet expose category — default to "Voucher" until added
    category: "Voucher" as const,
    isAvailable: r.isActive,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
        <RewardsClient
          rewards={rewards}
          userTokens={userTokens}
          isEligible={isEligible}
        />
      </div>
    </div>
  );
}
