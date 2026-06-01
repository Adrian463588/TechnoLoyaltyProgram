export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { RewardCatalogClient } from "@/features/admin/rewards/reward-catalog-client";
import { fetchRewardsAction } from "@/features/admin/rewards/actions";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Gift } from "lucide-react";

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

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card */}
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
                <Gift size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  Reward Catalog
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Create, update, and manage the collection of rewards available for employees.
                </p>
              </div>
            </div>
          </div>

          <div className="bento-span-12">
            <RewardCatalogClient initialRewards={initialRewards} />
          </div>
        </div>
      </main>
    </div>
  );
}
