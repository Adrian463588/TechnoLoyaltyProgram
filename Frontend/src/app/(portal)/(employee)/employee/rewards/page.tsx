export const dynamic = 'force-dynamic'

import { auth, getServerToken } from "@/lib/auth";
import { employeeApi } from "@/lib/api-client";
import RewardsClient from "./rewards-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ShoppingBag } from "lucide-react";

export default async function RewardsPage() {
  await auth();
  const token = await getServerToken();

  // Fetch token summary, dashboard (for user profile), and reward catalog in parallel
  const [dashboard, catalog] = await Promise.all([
    employeeApi.getDashboard(token).catch(() => null),
    employeeApi.getRewardCatalog(token).catch(() => []),
  ]);

  const userTokens = dashboard?.tokenSummary.totalTokens ?? 0;
  const isEligible = dashboard?.tokenSummary.isEligibleForReward ?? false;
  const userTier = dashboard?.user.membershipTier ?? "SAPHIRE";

  // Map backend DTO to the local RewardItem shape expected by RewardsClient
  const rewards = catalog.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    tokenCost: r.tokenCost,
    // Backend does not yet expose category — default to "Voucher" until added
    category: "Voucher" as const,
    imageUrl: r.imageUrl,
    isAvailable: r.isActive,
    stock: r.stock,
    minTier: r.minTier,
  }));
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header Card */}
        <div className="bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
              <ShoppingBag size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                Reward Catalog
              </h1>
              <p className="text-sm text-[--color-text-secondary]">
                Browse and redeem your tokens for exciting rewards and vouchers.
              </p>
            </div>
          </div>
        </div>

        <RewardsClient
          rewards={rewards}
          userTokens={userTokens}
          isEligible={isEligible}
          userTier={userTier}
          token={token}
        />
      </div>
    </div>
  );
}
