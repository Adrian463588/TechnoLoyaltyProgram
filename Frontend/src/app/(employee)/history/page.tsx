import { RewardRequest } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { RedemptionStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, History, Info } from "lucide-react";

// Mock history data — will be replaced by API call
const mockHistory: RewardRequest[] = [
  {
    id: "REQ-1001",
    userId: "EMP-001",
    rewardId: "RW-001",
    rewardName: "Exclusive Partner Voucher IDR 100k",
    tokensSpent: 2000,
    status: "Verified",
    requestedAt: "2026-05-09T10:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z",
  },
  {
    id: "REQ-0985",
    userId: "EMP-001",
    rewardId: "RW-002",
    rewardName: "Company Branded Hoodie",
    tokensSpent: 4500,
    status: "Completed",
    requestedAt: "2026-03-12T08:00:00Z",
    updatedAt: "2026-03-25T11:00:00Z",
  },
  {
    id: "REQ-0912",
    userId: "EMP-001",
    rewardId: "RW-004",
    rewardName: "Tech Gadget Bundle",
    tokensSpent: 7500,
    status: "Rejected",
    requestedAt: "2026-01-20T09:30:00Z",
    updatedAt: "2026-01-21T10:00:00Z",
    rejectReason: "Not eligible due to recent downgrade status.",
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RedemptionHistoryPage() {
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
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
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total Requests", value: mockHistory.length },
          { label: "Completed", value: mockHistory.filter((r) => r.status === "Completed").length },
          { label: "Pending", value: mockHistory.filter((r) => r.status === "Pending").length },
          { label: "Rejected", value: mockHistory.filter((r) => r.status === "Rejected").length },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5">
            <span className="text-xs text-muted-foreground">{label}:</span>
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* History Table */}
      {mockHistory.length === 0 ? (
        <BentoCard className="p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No Redemption History</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You haven&apos;t submitted any redemption requests yet.
            </p>
          </div>
        </BentoCard>
      ) : (
        <BentoCard className="overflow-hidden p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[110px]">Request ID</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {req.id}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{req.rewardName}</p>
                    {req.rejectReason && (
                      <div className="flex items-start gap-1 mt-1 text-xs text-destructive">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{req.rejectReason}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 font-semibold text-destructive">
                      <Coins className="w-3 h-3" />
                      {req.tokensSpent.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(req.requestedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(req.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <RedemptionStatusBadge status={req.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </BentoCard>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Redemption requests are verified by HC PM before processing. Rejected requests
          will include a reason visible here. Contact your HC PM for questions.
        </span>
      </div>
    </div>
  );
}
