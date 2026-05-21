/**
 * /employee/history — Token Ledger History (Server Component)
 * Fetches real token transaction data from /api/employee/history.
 * Falls back gracefully on backend unavailability.
 * 
 * Styled to match Rewards Catalog and Admin Adjustment Table.
 */
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, type TokenLedgerEntryResponse } from "@/lib/api-client";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { Pagination } from "@/components/shared/pagination";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, History, Info, Clock, TrendingUp, ShoppingBag, Gift, Zap } from "lucide-react";

export const metadata = { title: "Token History | Berijalan Loyalty" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const getEventMetadata = (type: string) => {
  switch (type) {
    case "EARNED_SHIFT":
      return { label: "Monthly Token Award", icon: TrendingUp, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
    case "EARNED_PROJECT":
      return { label: "Project Completion Bonus", icon: Gift, color: "text-success", bg: "bg-success/10", border: "border-success/20" };
    case "REDEEMED":
      return { label: "Reward Redemption", icon: ShoppingBag, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
    case "MANUAL_ADJUSTMENT":
      return { label: "Token Adjustment", icon: Coins, color: "text-info", bg: "bg-info/10", border: "border-info/20" };
    case "DOWNGRADE_PENALTY":
      return { label: "Tier Downgrade", icon: Clock, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
    case "RESET_PENALTY":
      return { label: "Period Reset", icon: Clock, color: "text-error", bg: "bg-error/10", border: "border-error/20" };
    case "EXPIRED":
      return { label: "Token Expired", icon: Clock, color: "text-muted", bg: "bg-slate-100", border: "border-slate-200" };
    default:
      return { label: type.replace(/_/g, ' '), icon: Zap, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
  }
};

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
  let totalCount = 0;
  
  try {
    const response = await employeeApi.getTokenHistory(token, { 
      limit: itemsPerPage, 
      offset 
    });
    entries = response.entries;
    totalCount = response.total;
  } catch (err) {
    console.warn(
      "[history] failed to fetch token history:",
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
        
        {/* Header Banner */}
        <BentoCard className="p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <History className="h-6 w-6 text-[--color-accent]" />
            <h1 className="text-card-heading text-2xl">Token History</h1>
          </div>
          <p className="text-[--color-text-secondary]">
            Detailed record of all your token earnings and usage activity.
          </p>
        </BentoCard>

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

        {/* History Table Card */}
        <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "200ms" }}>
          <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Ledger Activity</span>
            </div>
            <Badge variant="outline" className="rounded-md bg-[var(--color-surface-base)] px-3 py-1 font-mono text-[var(--color-text-secondary)]">
              Page {currentPage} of {totalPages}
            </Badge>
          </div>

          {entries.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center gap-4 bg-white">
              <div className="p-6 bg-slate-50 rounded-2xl text-slate-300">
                <History className="w-12 h-12" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-black">No activity recorded</h2>
                <p className="text-sm text-muted mt-2 max-w-xs mx-auto">
                  Once you start earning or redeeming tokens, your transaction history will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hide-scrollbar bg-white">
                <Table className="min-w-[900px]">
                  <TableHeader className="bg-[var(--color-surface-elevated)]/50">
                    <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                      <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Transaction Date</TableHead>
                      <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Activity Type</TableHead>
                      <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reason / Note</TableHead>
                      <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Amount</TableHead>
                      <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const meta = getEventMetadata(entry.eventType);
                      const Icon = meta.icon;
                      const isAddition = entry.amount > 0;

                      return (
                        <TableRow
                          key={entry.id}
                          className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                        >
                          <TableCell className="py-5 px-6 text-sm text-[var(--color-text-secondary)]">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", meta.bg, meta.color, meta.border)}>
                                <Icon size={18} />
                              </div>
                              <span className="text-sm font-semibold text-[--color-text-secondary] group-hover:text-[--color-text-primary] transition-colors">
                                {meta.label}
                              </span>                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <p className="text-sm text-[var(--color-text-secondary)] italic max-w-[300px] truncate">
                              {entry.reason || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="py-5 px-6 text-right">
                            <span className={cn(
                              "text-sm font-bold font-mono px-3 py-1 rounded-lg",
                              isAddition ? "text-success bg-success/5" : "text-error bg-error/5"
                            )}>
                              {isAddition ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="py-5 px-6 text-right">
                            <div className="text-sm font-bold text-[var(--color-text-primary)] font-mono">
                              {entry.balanceAfter.toLocaleString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={totalCount}
              />
            </>
          )}
        </BentoCard>

        {/* Footer Info */}
        <div className="flex items-start gap-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)]/30 rounded-2xl p-5 border border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: '250ms' }}>
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
            <Info size={14} aria-hidden="true" />
          </div>
          <p className="leading-relaxed">
            Ledger records are finalized and cannot be modified once committed. 
            If you believe there is a discrepancy in your token balance or activity, please contact the HC PM team with your transaction details.
          </p>
        </div>
      </div>
    </div>
  );
}
