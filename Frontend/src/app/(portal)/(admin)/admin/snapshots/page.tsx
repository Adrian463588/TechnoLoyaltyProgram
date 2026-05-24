import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Database, Info, Users } from "lucide-react";

// Mock data — will be replaced by API call
const mockSnapshots = [
  {
    id: "SNAP-P2-2025",
    periodName: "P2 2025 (Jun 16 – Dec 15, 2025)",
    cutOffDate: "2025-12-15T23:59:59Z",
    totalTokensIssued: 450200,
    totalUsersActive: 198,
    status: "Finalized" as const,
  },
  {
    id: "SNAP-P1-2025",
    periodName: "P1 2025 (Dec 16, 2024 – Jun 15, 2025)",
    cutOffDate: "2025-06-15T23:59:59Z",
    totalTokensIssued: 382500,
    totalUsersActive: 185,
    status: "Finalized" as const,
  },
  {
    id: "SNAP-P2-2024",
    periodName: "P2 2024 (Jun 16 – Dec 15, 2024)",
    cutOffDate: "2024-12-15T23:59:59Z",
    totalTokensIssued: 315800,
    totalUsersActive: 172,
    status: "Finalized" as const,
  },
];

const currentPeriod = {
  name: "P1 2026 (Dec 16, 2025 – Jun 15, 2026)",
  cutOff: "Jun 15, 2026",
  daysUntilCutOff: Math.max(
    0,
    Math.ceil((new Date("2026-06-15").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  ),
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SnapshotsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Period Snapshots
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Historical cut-off snapshots used for redemption eligibility and audit.
            </p>
          </div>

      {/* Active Period Banner */}
      <BentoCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/5 border-secondary/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-secondary/15 rounded-full">
            <CalendarDays className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Period</p>
            <p className="font-bold text-foreground text-lg">{currentPeriod.name}</p>
            <p className="text-sm text-muted-foreground">
              Cut-off on <span className="font-medium text-foreground">{currentPeriod.cutOff}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-secondary/15 text-secondary border-secondary/30 text-lg font-bold px-4 py-2">
            {currentPeriod.daysUntilCutOff} days
          </Badge>
          <span className="text-sm text-muted-foreground">until cut-off</span>
        </div>
      </BentoCard>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Snapshots"
          value={mockSnapshots.length}
          icon={Database}
          description="Historical finalized periods"
          accent="primary"
        />
        <StatCard
          label="Total Tokens Issued"
          value={(mockSnapshots.reduce((s, x) => s + x.totalTokensIssued, 0) / 1000).toFixed(1) + "k"}
          icon={Database}
          description="Across all completed periods"
          accent="secondary"
        />
        <StatCard
          label="Peak Active Users"
          value={Math.max(...mockSnapshots.map((s) => s.totalUsersActive))}
          icon={Users}
          description="Highest period participation"
          accent="muted"
        />
      </div>

      {/* Snapshots Table */}
      <BentoCard className="overflow-hidden p-0">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Historical Snapshots</h3>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[130px]">Snapshot ID</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Cut-Off Date</TableHead>
              <TableHead>Tokens Issued</TableHead>
              <TableHead>Active Users</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSnapshots.map((snap) => (
              <TableRow key={snap.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {snap.id}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {snap.periodName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(snap.cutOffDate)}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {snap.totalTokensIssued.toLocaleString()}
                </TableCell>
                <TableCell className="text-foreground">
                  {snap.totalUsersActive}
                </TableCell>
                <TableCell>
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    {snap.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </BentoCard>

      {/* Info banner */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Snapshots are generated automatically at each cut-off date (Jun 15 and Dec 15).
          They are immutable once finalized and serve as the source of truth for all
          redemption eligibility calculations.
        </span>
      </div>
      </div>
      </main>
    </div>
  );
}
