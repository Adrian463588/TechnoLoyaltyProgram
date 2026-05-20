/**
 * /employee/history — Redemption History (Server Component)
 * Fetches real redemption data from /api/employee/redemptions.
 * Falls back gracefully on backend unavailability.
 */
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, type RedemptionResponse } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { RedemptionStatusChip } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, History, Info, Clock } from "lucide-react";

export const metadata = { title: "Redemption History | Berijalan Loyalty" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RedemptionHistoryPage() {
  await auth();
  const token = await getServerToken();

  let redemptions: RedemptionResponse[] = [];
  try {
    redemptions = await employeeApi.getMyRedemptions(token);
  } catch (err) {
    console.warn(
      "[history] failed to fetch redemptions:",
      err instanceof Error ? err.message : err,
    );
  }

  const counts = {
    total: redemptions.length,
    completed: redemptions.filter((r) => r.status === "COMPLETED").length,
    pending: redemptions.filter((r) => r.status === "PENDING_VERIFICATION").length,
    rejected: redemptions.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-6 p-6">
      {/* Header Card */}
      <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
        <div>
          <h1 className="text-card-heading text-2xl mb-1 flex items-center gap-3">
            <History className="h-6 w-6 text-[--color-accent]" />
            Redemption History
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Track all your past and ongoing redemption requests.
          </p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-2 animate-fade-up-in" style={{ animationDelay: "50ms" }}>
        {[
          { label: "Total Requests", value: counts.total },
          { label: "Completed", value: counts.completed },
          { label: "Pending", value: counts.pending },
          { label: "Rejected", value: counts.rejected },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 bg-[var(--color-surface-elevated)]/30 px-4 py-2">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{label}:</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{value}</span>
          </div>
        ))}
      </div>

      {/* History Table Card */}
      <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "100ms" }}>
        <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">My Redemptions</span>
          </div>
          <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
            {redemptions.length} Records
          </Badge>
        </div>

        {redemptions.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="p-4 bg-[var(--color-surface-elevated)] rounded-full text-[var(--color-text-tertiary)]">
              <History className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-[var(--color-text-primary)]">No Redemption History</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-xs">
                You haven&apos;t submitted any redemption requests yet. Start exploring the rewards catalog!
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar">
            <Table data-testid="history-table" className="min-w-[900px]">
              <TableHeader className="bg-[var(--color-surface-elevated)]/50">
                <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                  <TableHead className="w-[120px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Request ID</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reward Item</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Tokens</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Requested At</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((req) => (
                  <TableRow
                    key={req.id}
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                  >
                    <TableCell className="py-4 px-6 text-xs text-[var(--color-text-tertiary)] font-mono">
                      #{req.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                        {req.item?.name ?? "—"}
                      </p>
                      {req.status === "REJECTED" && (
                        <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-red-500 font-medium">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                          <span>Contact HC PM for details.</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="flex items-center justify-end gap-1.5 text-sm font-mono font-bold text-red-500">
                        -{(req.item?.tokenCost ?? 0).toLocaleString()}
                        <Coins className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-tertiary)]">
                      {formatDate(req.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <RedemptionStatusChip
                        status={req.status as import("@/types").RewardRequestStatus}
                        className="shadow-sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </BentoCard>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)]/30 rounded-2xl p-5 border border-[var(--color-border-subtle)] animate-fade-up-in"
        style={{ animationDelay: "200ms" }}
        role="note"
      >
        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
          <Info className="w-4 h-4" aria-hidden="true" />
        </div>
        <p className="leading-relaxed">
          Redemption requests are verified by the HC team before processing. 
          Rejected requests will include a reason for your reference. 
          If you have any questions, please contact your HC PM directly.
        </p>
      </div>
    </div>
  );
}
