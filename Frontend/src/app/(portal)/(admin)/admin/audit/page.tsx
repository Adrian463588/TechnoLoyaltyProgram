import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api-client";
import { getServerToken } from "@/lib/auth";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Gift,
  Info,
  Settings,
  ShieldAlert,
  User,
  History,
} from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";

function getActionIcon(action: string) {
  if (action.includes("Upload"))        return <FileSpreadsheet className="w-3.5 h-3.5" />;
  if (action.includes("Verified"))      return <CheckCircle className="w-3.5 h-3.5" />;
  if (action.includes("Rejected"))      return <ShieldAlert className="w-3.5 h-3.5" />;
  if (action.includes("Snapshot"))      return <Activity className="w-3.5 h-3.5" />;
  if (action.includes("Redemption") || action.includes("Reward")) return <Gift className="w-3.5 h-3.5" />;
  if (action.includes("User") || action.includes("Role") || action.includes("Adjustment")) return <User className="w-3.5 h-3.5" />;
  return <Settings className="w-3.5 h-3.5" />;
}

function getActionBadgeStyles(action: string): string {
  if (action.includes("Verified"))  return "bg-emerald-500/10 border-emerald-200 text-emerald-600";
  if (action.includes("Rejected"))  return "bg-red-500/10 border-red-200 text-red-600";
  if (action.includes("Upload"))    return "bg-blue-500/10 border-blue-200 text-blue-600";
  if (action.includes("Snapshot"))  return "bg-purple-500/10 border-purple-200 text-purple-600";
  if (action.includes("Adjustment")) return "bg-orange-500/10 border-orange-200 text-orange-600";
  return "bg-neutral-500/10 border-neutral-200 text-neutral-600";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day:    "numeric",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function formatDetails(details: unknown): string {
  if (!details) return "—";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    const d = details as Record<string, unknown>;
    const parts: string[] = [];
    if (d.fileName)    parts.push(`File: ${d.fileName}`);
    if (d.rowCount)    parts.push(`Rows: ${d.rowCount}`);
    if (d.division)    parts.push(`Division: ${d.division}`);
    if (d.reason)      parts.push(`Reason: ${d.reason}`);
    if (d.rewardName)  parts.push(`Reward: ${d.rewardName}`);
    if (d.fromStatus)  parts.push(`${d.fromStatus} → ${d.toStatus}`);
    if (parts.length > 0) return parts.join(" • ");
    return JSON.stringify(details);
  }
  return String(details);
}

async function AuditTable({ 
  currentPage, 
  itemsPerPage, 
  offset 
}: { 
  currentPage: number; 
  itemsPerPage: number; 
  offset: number; 
}) {
  const token = await getServerToken();
  let logs: import("@/lib/api-client").AuditLogResponse[] = [];
  let totalCount = 0;

  try {
    const res = await adminApi.getAuditLogs(token, { limit: itemsPerPage, offset });
    logs = res.logs;
    totalCount = res.total;
  } catch (error) {
    console.warn("Failed to load audit logs:", error);
  }

  if (logs.length === 0) {
    return (
      <BentoCard className="p-16 text-center animate-fade-up-in">
        <Activity className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No audit events found</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-xs mx-auto">
          Admin actions and system events will appear here.
        </p>
      </BentoCard>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "100ms" }}>
      <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Audit Events</span>
        </div>
        <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
          {totalCount} Entries
        </Badge>
      </div>

      <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-[var(--color-surface-elevated)]/50">
            <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
              <TableHead className="w-[180px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Timestamp</TableHead>
              <TableHead className="w-[160px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              <TableHead className="w-[180px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Actor</TableHead>
              <TableHead className="w-[140px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Target</TableHead>
              <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log.id}
                className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
              >
                <TableCell className="py-4 px-6 text-xs text-[var(--color-text-tertiary)] font-mono whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm flex items-center w-fit gap-1.5 whitespace-nowrap",
                      getActionBadgeStyles(log.action)
                    )}
                  >
                    {getActionIcon(log.action)}
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex flex-col min-w-[120px]">
                    <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors truncate">
                      {log.actorName ?? "System"}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase tracking-tight">
                      {log.actorNpk ?? log.actorId.slice(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  {log.targetId ? (
                    <span className="text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)] font-mono">
                      {log.targetId.slice(0, 12)}...
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 min-w-[300px]">
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {formatDetails(log.details)}
                  </p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalCount}
      />
    </BentoCard>
  );
}

function AuditTableSkeleton() {
  return (
    <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)]">
      <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-[var(--color-border-subtle)] animate-pulse" />
        <div className="h-6 w-20 rounded-md bg-[var(--color-border-subtle)] animate-pulse" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-6 items-center px-2">
            <div className="h-3 w-28 rounded bg-[var(--color-border-subtle)] animate-pulse" />
            <div className="h-6 w-32 rounded-full bg-[var(--color-border-subtle)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--color-border-subtle)] animate-pulse" />
            <div className="h-3 w-20 rounded bg-[var(--color-border-subtle)] animate-pulse" />
            <div className="h-3 flex-1 rounded bg-[var(--color-border-subtle)] animate-pulse" />
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <Breadcrumb className="py-4" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card */}
          <div className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5">
                <History size={28} />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">
                  Audit Log
                </h1>
                <p className="text-sm text-[--color-text-secondary]">
                  Immutable record of all system events and administrative actions.
                </p>
              </div>
            </div>
          </div>

        {/* Audit Table */}
        <div className="bento-span-12">
          <Suspense fallback={<AuditTableSkeleton />} key={currentPage}>
            <AuditTable 
              currentPage={currentPage} 
              itemsPerPage={itemsPerPage} 
              offset={offset} 
            />
          </Suspense>
        </div>

        {/* Info banner */}
        <div className="bento-span-12 flex items-start gap-3 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)]/30 rounded-2xl p-5 border border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "200ms" }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-info)]" />
          <span className="leading-relaxed">
            Audit logs are append-only and cannot be modified. Every admin action,
            system event, and status change is captured here for compliance and traceability.
            Pagination ensures performance as the record volume grows.
          </span>
        </div>
      </div>
    </main>
    </div>
  );
}

