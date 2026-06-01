export const dynamic = 'force-dynamic'

/**
 * /employee/history — Token Ledger History (Server Component)
 * Fetches real token transaction data from /api/employee/history.
 * Falls back gracefully on backend unavailability.
 * 
 * Styled to match Rewards Catalog and Admin Adjustment Table.
 */
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, type TokenLedgerEntryResponse, type RedemptionResponse } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { BentoCard } from "@/components/ui/bento-card";
import { HistoryClient } from "./history-client";
import { History, TrendingUp, ShoppingBag, Zap, Coins } from "lucide-react";

export const metadata = { title: "Token History | Berijalan Loyalty" };

export default async function TokenHistoryPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  await auth();
  const token = await getServerToken();
  const searchParams = await props.searchParams;

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  let entries: TokenLedgerEntryResponse[] = [];
  let redemptions: RedemptionResponse[] = [];
  let totalCount = 0;

  try {
    const [historyRes, redemptionsRes] = await Promise.all([
      employeeApi.getTokenHistory(token, { limit: itemsPerPage, offset }),
      employeeApi.getMyRedemptions(token)
    ]);

    entries = historyRes.entries;
    totalCount = historyRes.total;
    redemptions = redemptionsRes;
  } catch (err) {
    console.warn(
      "[history] failed to fetch data:",
      err instanceof Error ? err.message : err,
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const stats = {
    earned: entries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0),
    spent: Math.abs(entries.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0)),
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6">
        <Breadcrumb className="py-4" />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6 animate-fade-up-in">

        {/* Header Card */}
        <div className="bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
              <History size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                Token History
              </h1>
              <p className="text-sm text-[--color-text-secondary]">
                Detailed record of all your token earnings and usage activity.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BentoCard className="p-6 flex flex-col h-full bg-white animate-fade-up-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Total Transactions</h3>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Historical Entries</span>
              <span className="text-xl font-bold text-foreground font-display">{totalCount}</span>
            </div>
          </BentoCard>

          <BentoCard className="p-6 flex flex-col h-full bg-white animate-fade-up-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Historical Earnings</h3>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Page Cumulative</span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-success font-display">
                +{stats.earned.toLocaleString()}
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </BentoCard>

          <BentoCard className="p-6 flex flex-col h-full bg-white animate-fade-up-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-error/10 flex items-center justify-center text-error border border-error/20">
                <ShoppingBag size={20} />
              </div>
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Historical Usage</h3>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Page Cumulative</span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-error font-display">
                -{stats.spent.toLocaleString()}
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </BentoCard>
        </div>

        <HistoryClient 
          entries={entries}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          redemptions={redemptions}
          sessionToken={token}
        />
      </div>
    </div>
  );
}
