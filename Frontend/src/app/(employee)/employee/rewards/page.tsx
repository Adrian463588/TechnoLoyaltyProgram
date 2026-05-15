import { auth, getServerToken } from "@/lib/auth";
import { employeeApi } from "@/lib/api-client";
import RewardsClient from "./rewards-client";

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
    <RewardsClient
      rewards={rewards}
      userTokens={userTokens}
      isEligible={isEligible}
    />
  );
}
