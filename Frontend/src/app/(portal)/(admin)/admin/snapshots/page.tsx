export const dynamic = "force-dynamic";

import { auth, getServerToken } from "@/lib/auth";
import { adminApi, type PeriodSnapshotResponse } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CalendarDays, Database, Info, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function numericMetric(snapshot: PeriodSnapshotResponse, key: string): number | null {
  const value = snapshot.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function SnapshotsPage() {
  await auth();
  const token = await getServerToken();

  let snapshots: PeriodSnapshotResponse[] = [];
  let loadError: string | null = null;
  try {
    snapshots = await adminApi.listSnapshots(token);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load snapshots.";
  }

  const tokenValues = snapshots.map((snapshot) => numericMetric(snapshot, "totalTokensIssued")).filter((value): value is number => value !== null);
  const activeUserValues = snapshots.map((snapshot) => numericMetric(snapshot, "totalUsersActive")).filter((value): value is number => value !== null);
  const totalTokens = tokenValues.length === snapshots.length && tokenValues.length > 0
    ? `${(tokenValues.reduce((sum, value) => sum + value, 0) / 1000).toFixed(1)}k`
    : "—";
  const peakUsers = activeUserValues.length === snapshots.length && activeUserValues.length > 0
    ? Math.max(...activeUserValues)
    : "—";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-6">
        <Breadcrumb className="py-4" />
      </div>
      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Period Snapshots</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">Immutable cut-off snapshots produced by the backend.</p>
        </div>

        <BentoCard className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-secondary/15 p-3"><CalendarDays className="h-6 w-6 text-secondary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Operational period</p>
              <p className="text-lg font-bold text-foreground">Configured by the active system settings</p>
              <p className="text-sm text-muted-foreground">Today: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
          <Badge className="w-fit border-secondary/30 bg-secondary/15 px-4 py-2 text-secondary">Source: API</Badge>
        </BentoCard>

        {loadError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Unable to load snapshots: {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Total Snapshots" value={snapshots.length} icon={Database} description="Persisted cut-off periods" accent="primary" />
          <StatCard label="Total Tokens Issued" value={totalTokens} icon={Database} description="Only when source payload provides the metric" accent="secondary" />
          <StatCard label="Peak Active Users" value={peakUsers} icon={Users} description="Only when source payload provides the metric" accent="muted" />
        </div>

        <BentoCard className="overflow-hidden p-0">
          <div className="border-b border-border p-6"><h2 className="text-lg font-semibold">Historical Snapshots</h2></div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Snapshot ID</TableHead><TableHead>Period</TableHead><TableHead>Cut-off Date</TableHead>
                <TableHead>Tokens Issued</TableHead><TableHead>Active Users</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No snapshots have been committed.</TableCell></TableRow>
              ) : snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{snapshot.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{snapshot.periodKey}{snapshot.division ? ` · ${snapshot.division}` : ""}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(snapshot.cutoffAt)}</TableCell>
                  <TableCell className="font-semibold text-foreground">{numericMetric(snapshot, "totalTokensIssued")?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell className="text-foreground">{numericMetric(snapshot, "totalUsersActive")?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell><Badge className="border-primary/30 bg-primary/10 text-primary">{snapshot.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </BentoCard>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Snapshots are immutable records created by the admin API. The payload is shown only through typed metrics when those metrics were present in the committed source.</span>
        </div>
      </main>
    </div>
  );
}
