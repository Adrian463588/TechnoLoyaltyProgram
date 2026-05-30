import { auth, getServerToken } from "@/lib/auth";
import { leaderApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ShoppingBag } from "lucide-react";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";

export default async function LeaderRedemptionsPage() {
  const token = await getServerToken();

  let teamRedemptions: any[] = [];
  try {
    const res = await leaderApi.listRedemptions(token, { limit: 100 });
    teamRedemptions = res.requests.map((r: any) => ({
      id: r.id,
      mitraName: r.mitra?.name ?? "—",
      division: r.mitra?.division ?? "—",
      rewardName: r.item?.name ?? "—",
      tokenCost: r.item?.tokenCost ?? 0,
      status: r.status as any,
      submittedAt: r.createdAt,
      userId: r.mitra?.id ?? "",
      userNpk: r.mitra?.npk ?? "—",
      userDocuments: r.mitra?.documents ?? [],
      rewardId: r.item?.id ?? "",
      tokensSpent: r.item?.tokenCost ?? 0,
      isRepresented: r.isRepresented,
      powerOfAttorneyUrl: r.powerOfAttorneyUrl,
      rejectReason: r.rejectReason,
    }));
  } catch (error) {
    console.error("Failed to fetch team redemptions:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm"> 
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Team Redemptions</h1>
              <p className="text-sm text-muted-foreground">Monitor reward redemptions from your division members.</p>     
            </div>
          </div>

          <div className="bento-card p-6 min-h-[400px]">
            <RedemptionQueueTable initialRequests={teamRedemptions} />
          </div>
        </div>
      </main>
    </div>
  );
}
