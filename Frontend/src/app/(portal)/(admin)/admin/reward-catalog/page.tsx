import { Metadata } from "next";
import { RewardCatalogClient } from "@/features/admin/rewards/reward-catalog-client";
import { fetchRewardsAction } from "@/features/admin/rewards/actions";
import { Breadcrumb } from "@/components/shared/breadcrumb";

export const metadata: Metadata = {
  title: "Reward Catalog | HC Admin",
};

export default async function RewardCatalogPage() {
  const initialRewards = await fetchRewardsAction();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          <div className="bento-span-12">
            <RewardCatalogClient initialRewards={initialRewards} />
          </div>
        </div>
      </main>
    </div>
  );
}
