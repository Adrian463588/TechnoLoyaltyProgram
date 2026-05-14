import { LoyaltyService } from "@/lib/services/mockApi";
import RewardsClient from "./rewards-client";

export default async function RewardsPage() {
  const currentUser = await LoyaltyService.getCurrentUser();
  const rewards = await LoyaltyService.getRewards();

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reward Catalog</h1>
          <p className="text-muted-foreground mt-1">Browse and redeem your loyalty tokens.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          Tokens Available: {currentUser.totalTokens.toLocaleString()}
        </div>
      </div>

      <RewardsClient 
        rewards={rewards} 
        userTokens={currentUser.totalTokens} 
        isEligible={currentUser.isEligibleForReward} 
      />
    </div>
  );
}
