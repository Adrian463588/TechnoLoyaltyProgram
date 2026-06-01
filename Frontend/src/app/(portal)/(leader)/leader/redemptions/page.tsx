import { auth, getServerToken } from "@/lib/auth";
import { leaderApi } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ShoppingBag, Clock, CheckCircle2, Coins } from "lucide-react";
import { TeamRedemptionsTable } from "@/components/dashboard/team-redemptions-table";
import { BentoCard } from "@/components/ui/bento-card";

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
      userNpk: r.mitra?.npk ?? "—",
    }));
  } catch (error) {
    console.error("Failed to fetch team redemptions:", error);
  }

  const stats = {
    total: teamRedemptions.length,
    pending: teamRedemptions.filter(r => r.status === "REQUESTED" || r.status === "REVIEWED").length,
    approved: teamRedemptions.filter(r => r.status === "ACCEPTED").length,
    totalTokens: teamRedemptions
      .filter(r => r.status === "ACCEPTED")
      .reduce((acc, r) => acc + (r.tokensSpent || 0), 0)
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col gap-6">
          {/* Header Card */}
          <BentoCard className="p-6 bg-white border-[var(--color-border-subtle)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0"> 
                <ShoppingBag size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground leading-tight">Team Redemptions</h1>
                <p className="text-sm text-muted-foreground">Monitor reward redemptions from your division members.</p>     
              </div>
            </div>
          </BentoCard>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BentoCard className="p-4 flex items-center gap-4 bg-white border-[var(--color-border-subtle)] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Requests</p>
                <p className="text-xl font-black text-slate-700">{stats.total}</p>
              </div>
            </BentoCard>
            
            <BentoCard className="p-4 flex items-center gap-4 bg-white border-[var(--color-border-subtle)] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Approval</p>
                <p className="text-xl font-black text-slate-700">{stats.pending}</p>
              </div>
            </BentoCard>

            <BentoCard className="p-4 flex items-center gap-4 bg-white border-[var(--color-border-subtle)] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
                <p className="text-xl font-black text-slate-700">{stats.approved}</p>
              </div>
            </BentoCard>

            <BentoCard className="p-4 flex items-center gap-4 bg-white border-[var(--color-border-subtle)] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tokens Spent</p>
                <p className="text-xl font-black text-slate-700">{stats.totalTokens}</p>
              </div>
            </BentoCard>
          </div>

          <div className="min-h-[400px]">
            <TeamRedemptionsTable requests={teamRedemptions} />
          </div>
        </div>
      </main>
    </div>
  );
}
