/**
 * /employee/history — Redemption History (Server Component)
 * Fetches real redemption data from /api/employee/redemptions.
 * Falls back gracefully on backend unavailability.
 */
import { auth, getServerToken } from "@/lib/auth";
import { employeeApi, type RedemptionResponse } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { RedemptionStatusChip } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, History, Info } from "lucide-react";

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
    <div className="max-w-5xl mx-auto w-full space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Redemption History
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all your past and ongoing redemption requests.
        </p>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3" role="status" aria-label="Redemption summary">
        {[
          { label: "Total Requests", value: counts.total },
          { label: "Completed", value: counts.completed },
          { label: "Pending", value: counts.pending },
          { label: "Rejected", value: counts.rejected },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5">
            <span className="text-xs text-muted-foreground">{label}:</span>
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* History Table */}
      {redemptions.length === 0 ? (
        <BentoCard className="p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <History className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">No Redemption History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You haven&apos;t submitted any redemption requests yet.
            </p>
          </div>
        </BentoCard>
      ) : (
        <BentoCard className="overflow-hidden p-0">
          <Table data-testid="history-table">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[130px]">Request ID</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.map((req) => (
                <TableRow key={req.id} data-testid="history-row">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {req.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{req.item?.name ?? "—"}</p>
                    {req.status === "REJECTED" && (
                      <div className="flex items-start gap-1 mt-1 text-xs text-destructive">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>Rejected — contact HC PM for details.</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 font-semibold text-destructive">
                      <Coins className="w-3 h-3" aria-hidden="true" />
                      {(req.item?.tokenCost ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell>
                    <RedemptionStatusChip
                      status={req.status as import("@/types").RewardRequestStatus}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </BentoCard>
      )}

      {/* Info banner */}
      <div
        className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border"
        role="note"
      >
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Redemption requests are verified by HC PM before processing. Rejected requests
          will include a reason. Contact your HC PM for questions.
        </span>
      </div>
    </div>
  );
}
