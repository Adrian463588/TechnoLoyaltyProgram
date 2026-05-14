"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  UserX,
  Zap,
} from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertType     = "DOWNGRADE" | "RESET" | "INACTIVE" | "INACTIVITY";

interface TeamAlert {
  id:       string;
  type:     AlertType;
  severity: AlertSeverity;
  member:   string;
  npk:      string;
  message:  string;
  date:     string;
  resolved: boolean;
}

// ── Mock data (replace with API call when backend is ready) ──

const mockAlerts: TeamAlert[] = [
  {
    id:       "1",
    type:     "DOWNGRADE",
    severity: "critical",
    member:   "Bob Techno",
    npk:      "EMP002",
    message:  "3 project rejections this period — at risk of tier downgrade.",
    date:     "2026-05-08",
    resolved: false,
  },
  {
    id:       "2",
    type:     "RESET",
    severity: "high",
    member:   "Charlie Optel",
    npk:      "EMP003",
    message:  "2 consecutive low-performance periods — membership reset triggered.",
    date:     "2026-05-07",
    resolved: false,
  },
  {
    id:       "3",
    type:     "INACTIVITY",
    severity: "medium",
    member:   "Frank Techno",
    npk:      "EMP006",
    message:  "No slot activity recorded for the past 45 days.",
    date:     "2026-05-01",
    resolved: false,
  },
  {
    id:       "4",
    type:     "DOWNGRADE",
    severity: "low",
    member:   "Grace Optel",
    npk:      "EMP007",
    message:  "Missed 2 slots this month — monitor for continued trend.",
    date:     "2026-04-28",
    resolved: true,
  },
];

// ── Config maps ──────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, {
  border:   string;
  bg:       string;
  text:     string;
  badge:    string;
  dot:      string;
  label:    string;
}> = {
  critical: {
    border: "border-destructive/50",
    bg:     "bg-destructive/8",
    text:   "text-destructive",
    badge:  "bg-destructive/15 text-destructive border-destructive/30",
    dot:    "bg-destructive",
    label:  "Critical",
  },
  high: {
    border: "border-destructive/30",
    bg:     "bg-destructive/5",
    text:   "text-destructive",
    badge:  "bg-destructive/10 text-destructive border-destructive/20",
    dot:    "bg-orange-500",
    label:  "High",
  },
  medium: {
    border: "border-yellow-600/40",
    bg:     "bg-yellow-950/20",
    text:   "text-yellow-400",
    badge:  "bg-yellow-950/30 text-yellow-400 border-yellow-700/40",
    dot:    "bg-yellow-400",
    label:  "Medium",
  },
  low: {
    border: "border-border",
    bg:     "bg-muted/20",
    text:   "text-muted-foreground",
    badge:  "bg-muted/40 text-muted-foreground border-border",
    dot:    "bg-muted-foreground",
    label:  "Low",
  },
};

const TYPE_CONFIG: Record<AlertType, {
  icon:  React.ElementType;
  label: string;
}> = {
  DOWNGRADE:  { icon: TrendingDown, label: "Tier Downgrade"  },
  RESET:      { icon: Zap,          label: "Token Reset"     },
  INACTIVE:   { icon: UserX,        label: "Inactive"        },
  INACTIVITY: { icon: UserX,        label: "Inactivity"      },
};

// ── Alert Card ───────────────────────────────────────────────

function AlertCard({ alert, onResolve }: { alert: TeamAlert; onResolve: (id: string) => void }) {
  const sev  = SEVERITY_CONFIG[alert.severity];
  const type = TYPE_CONFIG[alert.type] ?? { icon: AlertTriangle, label: alert.type };
  const Icon = type.icon;
  const isPulsing = alert.severity === "critical" || alert.severity === "high";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border-l-4 border p-5 flex items-start gap-4",
        "transition-all duration-200 hover:scale-[1.01] hover:shadow-lg",
        sev.border, sev.bg
      )}
    >
      {/* Severity indicator icon */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        sev.badge
      )}>
        {isPulsing && (
          <span className={cn("absolute h-2.5 w-2.5 rounded-full top-3 right-3 animate-dot-pulse", sev.dot)} />
        )}
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-foreground text-sm">{alert.member}</span>
          <span className="font-mono text-xs text-muted-foreground">({alert.npk})</span>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", sev.badge)}>
            {type.label}
          </span>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", sev.badge)}>
            {sev.label}
          </span>
        </div>

        <p className={cn("text-sm mt-1", sev.text)}>{alert.message}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(alert.date).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric"
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onResolve(alert.id)}
          >
            Mark Resolved
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function LeaderAlertsPage() {
  const [alerts, setAlerts] = useState<TeamAlert[]>(mockAlerts);

  const handleResolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a));
  };

  const active   = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) =>  a.resolved);

  const criticalCount = active.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const mediumCount   = active.filter((a) => a.severity === "medium").length;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Alerts</h1>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-1 text-xs font-bold text-destructive animate-glow-ring">
                <Bell className="h-3 w-3" />
                {criticalCount} urgent
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Members flagged for downgrade, reset, or inactivity risks.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <BentoCard className={cn(
          "p-4 flex flex-col gap-1 border-l-4 transition-all hover:scale-[1.02]",
          "border-l-destructive border-destructive/30"
        )}>
          <p className="text-xs text-muted-foreground">High Priority</p>
          <p className="text-3xl font-bold text-destructive tabular-nums">{criticalCount}</p>
          <div className="flex items-center gap-1 text-xs text-destructive/70">
            <TrendingUp className="h-3 w-3" />
            Needs immediate action
          </div>
        </BentoCard>
        <BentoCard className={cn(
          "p-4 flex flex-col gap-1 border-l-4 transition-all hover:scale-[1.02]",
          "border-l-yellow-500 border-yellow-600/20"
        )}>
          <p className="text-xs text-muted-foreground">Medium Priority</p>
          <p className="text-3xl font-bold text-yellow-400 tabular-nums">{mediumCount}</p>
          <div className="flex items-center gap-1 text-xs text-yellow-500/70">
            <AlertTriangle className="h-3 w-3" />
            Monitor closely
          </div>
        </BentoCard>
        <BentoCard className={cn(
          "p-4 flex flex-col gap-1 border-l-4 transition-all hover:scale-[1.02]",
          "border-l-primary border-primary/30"
        )}>
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{resolved.length}</p>
          <div className="flex items-center gap-1 text-xs text-primary/70">
            <CheckCircle2 className="h-3 w-3" />
            This period
          </div>
        </BentoCard>
      </div>

      {/* Active Alerts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Active Alerts
          </h2>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-foreground font-bold">
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <BentoCard className="p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">All Clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No active alerts for your team right now.</p>
          </BentoCard>
        ) : (
          <div className="space-y-3">
            {active.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </section>

      {/* Resolved Alerts */}
      {resolved.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Resolved
            </h2>
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-foreground font-bold">
              {resolved.length}
            </span>
          </div>
          <div className="space-y-2">
            {resolved.map((alert) => {
              const type = TYPE_CONFIG[alert.type] ?? { icon: AlertTriangle, label: alert.type };
              const Icon = type.icon;
              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4 flex items-center gap-4 opacity-50 hover:opacity-70 transition-opacity"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/30">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-muted-foreground line-through">
                        {alert.member}
                      </span>
                      <Badge variant="outline" className="text-[10px]">Resolved</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-through">{alert.message}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
