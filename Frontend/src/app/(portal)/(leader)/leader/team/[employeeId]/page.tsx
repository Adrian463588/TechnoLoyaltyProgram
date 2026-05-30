export const dynamic = 'force-dynamic'

/**
 * /leader/team/[employeeId] — Team member detail (PRD TL-03)
 *
 * Server Component: fetches member detail from backend with TL RBAC enforced server-side.
 * Falls back gracefully if backend unavailable.
 */
import { auth, getServerToken } from "@/lib/auth";
import { leaderApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, User, History, Shield } from "lucide-react";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { MemberPerformanceCard } from "@/components/shared/member-performance-card";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const metadata = { title: "Member Detail | Berijalan Loyalty" };

export default async function MemberDetailPage(props: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { employeeId } = await props.params;
  const searchParams = await props.searchParams;
  await auth();
  const token = await getServerToken();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  let detail = null;
  try {
    detail = await leaderApi.getMemberDetail(token, employeeId, { 
      limit: itemsPerPage, 
      offset 
    });
  } catch {
    notFound();
  }

  if (!detail) notFound();

  const { member, ledger, total = 0 } = detail;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Derive trend from last 7 entries in ledger for the sparkline
  const trendData = ledger.slice(0, 7).reverse().map(l => l.balanceAfter);
  if (trendData.length === 0) trendData.push(member.totalTokens || 0);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="space-y-6">
          {/* New Performance Header Card */}
          <div className="animate-fade-up-in">
            <MemberPerformanceCard 
              member={{
                id: member.id,
                name: member.name,
                npk: member.npk,
                division: member.division,
                tokens: member.totalTokens || 0,
                tier: (member.tier?.toUpperCase() || "SAPHIRE") as any,
                status: member.status as any,
                trend: trendData
              }}
            />
          </div>

          {/* Token Ledger History Table */}
          <div className="bento-span-12 bento-card overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in stagger-2">
            <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">Token History</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total {total.toLocaleString()} Transactions
              </span>
            </div>

            {ledger.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground text-sm">
                No token history found for this member.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="py-4 px-6 font-semibold text-slate-500">Event</TableHead>
                        <TableHead className="py-4 px-6 font-semibold text-slate-500">Amount</TableHead>
                        <TableHead className="py-4 px-6 font-semibold text-slate-500">Balance After</TableHead>
                        <TableHead className="py-4 px-6 font-semibold text-slate-500">Date</TableHead>
                        <TableHead className="py-4 px-6 font-semibold text-slate-500">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.map((entry) => (
                        <TableRow key={entry.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-accent)]/[0.05] transition-all">
                          <TableCell className="py-4 px-6 text-xs uppercase tracking-tight text-slate-500">
                            {entry.eventType}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className={cn(
                              entry.amount >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {entry.amount >= 0 ? "+" : ""}{entry.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-slate-500">
                            {entry.balanceAfter.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-sm text-slate-500">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-sm text-slate-500 max-w-[300px] truncate">
                            {entry.reason ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                <div className="p-4 border-t border-[var(--color-border-subtle)] bg-slate-50/30">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    totalResults={total}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
