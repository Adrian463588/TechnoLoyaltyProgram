"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/frontend/components/ui/glass-card";
import { useCountUp } from "@/frontend/hooks/use-count-up";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PeriodProgress } from "@/components/shared/period-progress";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  SkeletonBentoCard,
  SkeletonStatCard,
  SkeletonRow,
} from "@/components/shared/skeleton-card";
import {
  AlertCircle,
  ArrowRight,
  Coins,
  Crown,
  Gift,
  History,
  Info,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  Timer,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Tier config ───────────────────────────────────────────────
const TIER_CONFIG = {
  Bronze:   { color: "text-amber-600",  bg: "bg-amber-50",    border: "border-amber-200",  glow: "shadow-amber-100",  min: 0    },
  Silver:   { color: "text-slate-500",  bg: "bg-slate-50",    border: "border-slate-200",  glow: "shadow-slate-100",  min: 1500 },
  Gold:     { color: "text-yellow-600", bg: "bg-yellow-50",   border: "border-yellow-200", glow: "shadow-yellow-100", min: 3000 },
  Platinum: { color: "text-blue-600",   bg: "bg-blue-50",     border: "border-blue-200",   glow: "shadow-blue-100",   min: 6000 },
} as const;

type Tier = keyof typeof TIER_CONFIG;

// ── StatPill ──────────────────────────────────────────────────
function StatPill({
  label, value, icon: Icon, colorClass = "text-primary", suffix = "",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
  suffix?: string;
}) {
  return (
    <GlassCard
      variant="subtle"
      glow={false}
      lift={false}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-colors"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className={cn("text-sm font-bold tabular-nums leading-none", colorClass)}>
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && <span className="text-xs font-normal ml-0.5">{suffix}</span>}
        </p>
      </div>
    </GlassCard>
  );
}

// ── ActivityRow ───────────────────────────────────────────────
function ActivityRow({
  type, amount, date, sign, delay, id,
}: {
  type: string; amount: number; date: string; sign: "+" | "-"; delay: number; id: number;
}) {
  const isGain = sign === "+";
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 -mx-1",
        "transition-all duration-150 hover:bg-black/[0.03] cursor-default",
        "animate-fade-up-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`employee-dashboard-activity-${id}`}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm shadow-sm",
        isGain ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      )}>
        {isGain ? <TrendingUp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{type}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <span className={cn(
        "font-bold tabular-nums text-sm flex items-center gap-1",
        isGain ? "text-primary" : "text-destructive"
      )}>
        {sign}{amount.toLocaleString()} <Coins className="h-3 w-3" />
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function EmployeeDashboardPage() {
  const [loading,       setLoading      ] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  // Mock data — replace with server fetch in next iteration
  const totalTokens      = 4500;
  const remainingTokens  = 3200;
  const spentTokens      = totalTokens - remainingTokens;
  const currentTier      = "Gold"     as Tier;
  const nextTier         = "Platinum" as Tier;
  const totalForNextTier = 6000;
  const pointsToNextTier = totalForNextTier - totalTokens;
  const progressPercent  = (totalTokens / totalForNextTier) * 100;
  const employeeStatus   = "Active"   as const;
  const tokenAge         = 8;
  const isEligible       = remainingTokens >= 2000;
  const tierConfig       = TIER_CONFIG[currentTier];

  const periodStart = new Date("2025-12-16");
  const periodEnd   = new Date("2026-06-15");

  const recentActivities = [
    { id: 1, type: "Optel Slot",        amount: 500,  date: "10 May 2026",  sign: "+" as const },
    { id: 2, type: "Techno Sprint",     amount: 1200, date: "28 Apr 2026",  sign: "+" as const },
    { id: 3, type: "Optel Slot",        amount: 300,  date: "15 Apr 2026",  sign: "+" as const },
    { id: 4, type: "Reward Redemption", amount: 2000, date: "1 Apr 2026",   sign: "-" as const },
  ];

  const animatedTokens = useCountUp(loading ? 0 : totalTokens, 1400, 150);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setProgressValue(progressPercent), 200);
    }, 1000);
    return () => clearTimeout(t);
  }, [progressPercent]);

  // ── Skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-36 rounded bg-slate-200/60 animate-skeleton" />
          <div className="h-8 w-48 rounded bg-slate-200/60 animate-skeleton stagger-1" />
          <div className="h-4 w-56 rounded bg-slate-200/60 animate-skeleton stagger-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBentoCard className="md:col-span-2" />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBentoCard className="md:col-span-2" />
          <SkeletonStatCard />
        </div>
        <SkeletonBentoCard>
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} className={`stagger-${i}`} />)}
        </SkeletonBentoCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5 animate-fade-up-in">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Welcome back, Mitra — here&apos;s your loyalty overview for P1 2026.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EmployeeStatusBadge status={employeeStatus} />
          <TierBadge tier={currentTier} />
        </div>
      </div>

      {/* ── Hero Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Token Hero Card */}
        <GlassCard
          variant="elevated"
          glow={true}
          className="md:col-span-2 p-7 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Coins className="w-3.5 h-3.5 text-primary" />
                Total Tokens Earned
              </p>
              <h2
                className="text-7xl font-black tracking-tight text-foreground tabular-nums leading-none"
                data-testid="employee-dashboard-total-tokens-value"
                style={{ textShadow: "0 4px 24px rgba(37,99,235,0.15)" }}
              >
                {animatedTokens.toLocaleString()}
              </h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{remainingTokens.toLocaleString()}</span> remaining ·{" "}
                <span className="font-semibold text-destructive">{spentTokens.toLocaleString()}</span> redeemed
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm",
                tierConfig.bg, tierConfig.border
              )}>
                <Crown className={cn("w-4 h-4", tierConfig.color)} />
                <span className={cn("text-sm font-bold", tierConfig.color)}>{currentTier}</span>
              </div>
              <span className="text-xs text-muted-foreground text-right">{tokenAge} months<br />accumulated</span>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="mt-8 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                Progress to {nextTier}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {pointsToNextTier.toLocaleString()} more needed
              </span>
            </div>
            <div className="relative">
              <Progress
                value={progressValue}
                className="h-3 transition-all duration-1000 ease-out"
                data-testid="employee-dashboard-tier-progress"
              />
              {/* Milestone marker */}
              <div
                className="absolute top-0 h-3 w-0.5 bg-white/70 rounded-full"
                style={{ left: "50%" }}
                title="Silver tier boundary"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={cn("font-medium", tierConfig.color)}>{currentTier}</span>
              <span className="font-medium text-blue-600">{nextTier}</span>
            </div>
          </div>
        </GlassCard>

        {/* Eligibility Card */}
        <GlassCard
          variant="default"
          glow={isEligible}
          className="p-6 flex flex-col items-center justify-center text-center space-y-5"
        >
          {/* Animated icon ring */}
          <div className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-md",
            isEligible ? "bg-primary/10" : "bg-slate-100",
            "ring-2 ring-offset-2 ring-offset-white/50 transition-all duration-300",
            isEligible ? "ring-primary/25" : "ring-slate-200"
          )}>
            {isEligible ? (
              <>
                <Sparkles className="w-7 h-7 text-primary" />
                <span className="absolute inset-0 rounded-2xl animate-glow-ring ring-2 ring-primary/20" />
              </>
            ) : (
              <LockKeyhole className="w-7 h-7 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-foreground">
              {isEligible ? "Ready to Redeem!" : "Not Yet Eligible"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[180px]">
              {isEligible
                ? `${remainingTokens.toLocaleString()} tokens ready for the reward catalog.`
                : "Earn 2,000+ tokens to unlock the full reward catalog."}
            </p>
          </div>

          <Link
            href="/employee/rewards"
            className={buttonVariants({ variant: "default", className: "w-full group shadow-sm shadow-primary/20" })}
            data-testid="employee-dashboard-redeem-button"
          >
            View Catalog
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {!isEligible && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <LockKeyhole className="w-3 h-3" />
              {(2000 - remainingTokens).toLocaleString()} tokens to go
            </p>
          )}
        </GlassCard>
      </div>

      {/* ── Quick Stats Strip ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Total Earned"  value={totalTokens}      icon={Coins}  colorClass="text-foreground"    />
        <StatPill label="Remaining"     value={remainingTokens}  icon={Zap}    colorClass="text-primary"       />
        <StatPill label="Redeemed"      value={spentTokens}      icon={Gift}   colorClass="text-destructive"   />
        <StatPill label="To Next Tier"  value={pointsToNextTier} icon={Crown}  colorClass="text-blue-600"      />
      </div>

      {/* ── Secondary Row ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Progress */}
        <GlassCard className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Active Earning Period</h3>
          </div>
          <PeriodProgress
            periodName="Period 1 (P1)"
            startDate={periodStart}
            endDate={periodEnd}
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-3 border border-primary/10">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
            <span>
              Tokens earned in P1 freeze on{" "}
              <span className="font-semibold text-foreground">Jun 15, 2026</span> for the
              redemption snapshot. Redemptions use that locked balance.
            </span>
          </div>
        </GlassCard>

        {/* Token split bar */}
        <GlassCard className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Token Breakdown</p>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "Total Earned",  value: totalTokens,     colorClass: "text-foreground",  barColor: "bg-slate-300",    pct: 1                             },
              { label: "Redeemed",      value: spentTokens,     colorClass: "text-destructive", barColor: "bg-destructive/70", pct: spentTokens / totalTokens    },
              { label: "Remaining",     value: remainingTokens, colorClass: "text-primary",     barColor: "bg-primary",       pct: remainingTokens / totalTokens },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-sm font-bold tabular-nums", item.colorClass)}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.barColor)}
                    style={{ width: loading ? "0%" : `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Recent Activity ─────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            Recent Activity
          </h3>
          <Link
            href="/employee/history"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "group text-muted-foreground hover:text-foreground" })}
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="space-y-1">
          {recentActivities.map((activity, i) => (
            <ActivityRow
              key={activity.id}
              {...activity}
              delay={i * 60}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
