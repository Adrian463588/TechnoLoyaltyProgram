import { prisma } from "@/lib/db";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Suspense } from "react";

function getActionIcon(action: string) {
  if (action.includes("Upload"))        return <FileSpreadsheet className="w-4 h-4 text-secondary" />;
  if (action.includes("Verified"))      return <CheckCircle className="w-4 h-4 text-primary" />;
  if (action.includes("Rejected"))      return <ShieldAlert className="w-4 h-4 text-destructive" />;
  if (action.includes("Snapshot"))      return <Activity className="w-4 h-4 text-muted-foreground" />;
  if (action.includes("Redemption") || action.includes("Reward")) return <Gift className="w-4 h-4 text-primary" />;
  if (action.includes("User") || action.includes("Role"))         return <User className="w-4 h-4 text-muted-foreground" />;
  return <Settings className="w-4 h-4 text-muted-foreground" />;
}

function getActionBadgeColor(action: string): string {
  if (action.includes("Verified"))  return "bg-primary/10 border-primary/20 text-primary";
  if (action.includes("Rejected"))  return "bg-destructive/10 border-destructive/20 text-destructive";
  if (action.includes("Upload"))    return "bg-secondary/10 border-secondary/20 text-secondary";
  if (action.includes("Snapshot"))  return "bg-muted/40 border-border text-muted-foreground";
  return "bg-muted/30 border-border text-muted-foreground";
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-GB", {
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
    // Pretty-print common fields
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

async function AuditTable() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take:    100,
  });

  // Resolve unique actor IDs to names for display
  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, npk: true },
  });
  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

  if (logs.length === 0) {
    return (
      <BentoCard className="p-12 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No audit events yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Admin actions and system events will appear here.
        </p>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <p className="text-sm font-medium text-foreground">Audit Events</p>
        <Badge variant="outline" className="text-xs">{logs.length} entries</Badge>
      </div>
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[160px]">Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className="hover:bg-muted/20 transition-colors border-border group"
            >
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                {formatDate(log.createdAt)}
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${getActionBadgeColor(log.action)}`}>
                  {getActionIcon(log.action)}
                  <span className="font-medium">{log.action}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium text-foreground">{actorMap[log.actorId]?.name ?? "System"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{actorMap[log.actorId]?.npk ?? log.actorId.slice(0, 8)}</p>
                </div>
              </TableCell>
              <TableCell>
                {log.targetId ? (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {log.targetId}
                    {log.targetType && (
                      <span className="ml-1 text-muted-foreground/60">({log.targetType})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-xs text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                  {formatDetails(log.details)}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </BentoCard>
  );
}

function AuditTableSkeleton() {
  return (
    <BentoCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="h-4 w-24 rounded bg-muted/50 animate-skeleton" />
        <div className="h-5 w-16 rounded-full bg-muted/50 animate-skeleton" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-4 w-28 rounded bg-muted/40 animate-skeleton" />
            <div className="h-6 w-40 rounded-full bg-muted/40 animate-skeleton" />
            <div className="h-4 w-24 rounded bg-muted/40 animate-skeleton" />
            <div className="h-4 w-20 rounded bg-muted/40 animate-skeleton" />
            <div className="h-4 flex-1 rounded bg-muted/40 animate-skeleton" />
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

export default function AuditLogPage() {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Immutable record of all system events and administrative actions.
          </p>
        </div>
      </div>

      {/* Action Type Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: <FileSpreadsheet className="w-3.5 h-3.5 text-secondary" />, label: "Upload",       color: "bg-secondary/10 border-secondary/20" },
          { icon: <CheckCircle     className="w-3.5 h-3.5 text-primary" />,   label: "Verification", color: "bg-primary/10 border-primary/20"   },
          { icon: <ShieldAlert     className="w-3.5 h-3.5 text-destructive" />, label: "Rejection",  color: "bg-destructive/10 border-destructive/20" },
          { icon: <Activity        className="w-3.5 h-3.5 text-muted-foreground" />, label: "System", color: "bg-muted/40 border-border"         },
        ].map(({ icon, label, color }) => (
          <div key={label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${color}`}>
            {icon}
            <span className="font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Audit Table — Suspense boundary for streaming */}
      <Suspense fallback={<AuditTableSkeleton />}>
        <AuditTable />
      </Suspense>

      {/* Info banner */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Audit logs are append-only and cannot be modified. Every admin action,
          system event, and status change is captured here for compliance and traceability.
          Showing last 100 events.
        </span>
      </div>
    </div>
  );
}
