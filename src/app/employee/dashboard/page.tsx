"use client";

import { useEffect, useRef, useState } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
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

// ── Animated counter ─────────────────────────────────────────
function useCountUp(target: number, duration = 1400, delay = 200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now() + delay;
    function tick() {
      const now = Date.now();
      if (now < start) { raf.current = requestAnimationFrame(tick); return; }
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);

  return value;
}

// ── Tier config ───────────────────────────────────────────────
const TIER_CONFIG = {
  Bronze:   { color: "text-amber-600",  bg: "bg-amber-900/30",    border: "border-amber-600/30",  glow: "shadow-amber-600/20",  min: 0    },
  Silver:   { color: "text-slate-400",  bg: "bg-slate-800/30",    border: "border-slate-400/30",  glow: "shadow-slate-400/20",  min: 1500 },
  Gold:     { color: "text-yellow-400", bg: "bg-yellow-900/30",   border: "border-yellow-400/30", glow: "shadow-yellow-400/20", min: 3000 },
  Platinum: { color: "text-cyan-400",   bg: "bg-cyan-900/30",     border: "border-cyan-400/30",   glow: "shadow-cyan-400/20",   min: 6000 },
};

type Tier = keyof typeof TIER_CONFIG;

// ── Mini stat card ────────────────────────────────────────────
function StatPill({
  label, value, icon: Icon, color = "text-primary", suffix = "",
}: {
  label: string; value: string | number; icon: React.ElementType;
  color?: string; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className={cn("text-sm font-bold tabular-nums leading-none", color)}>
          {typeof value === "number" ? value.toLocaleString() : value}{suffix && <span className="text-xs font-normal ml-0.5">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────
function ActivityRow({
  type, amount, date, sign, delay,
  id,
}: {
  type: string; amount: number; date: string; sign: "+" | "-";
  delay: number; id: number;
}) {
  const isGain = sign === "+";
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 -mx-1",
        "transition-all duration-150 hover:bg-muted/30 cursor-default",
        "animate-fade-up-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`employee-dashboard-activity-${id}`}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm",
        isGain ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
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
  const [loading,       setLoading       ] = useState(true);
  const [progressValue, setProgressValue ] = useState(0);

  // Mock data — replace with server data fetch
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

  const tierConfig = TIER_CONFIG[currentTier];

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

  // ── Skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-36 rounded bg-muted/50 animate-skeleton" />
          <div className="h-8 w-48 rounded bg-muted/50 animate-skeleton stagger-1" />
          <div className="h-4 w-56 rounded bg-muted/50 animate-skeleton stagger-2" />
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
        <BentoCard
          className={cn(
            "md:col-span-2 p-7 flex flex-col justify-between",
            "bg-gradient-to-br from-card via-[hsl(var(--color-vivid-green)/0.04)] to-card",
            "border-primary/25 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--color-vivid-green)/0.12)]",
            "transition-all duration-300"
          )}
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
                style={{ textShadow: "0 0 60px hsl(var(--color-green-glow)/0.4)" }}
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
                "flex items-center gap-2 rounded-xl border px-3 py-2",
                tierConfig.bg, tierConfig.border,
                "shadow-lg", tierConfig.glow
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

            {/* Segmented progress bar */}
            <div className="relative">
              <Progress
                value={progressValue}
                className="h-3 transition-all duration-1000 ease-out"
                data-testid="employee-dashboard-tier-progress"
              />
              {/* Milestone marker at 50% (Silver→Gold line) */}
              <div
                className="absolute top-0 h-3 w-0.5 bg-background/50 rounded-full"
                style={{ left: "50%" }}
                title="Silver tier boundary"
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={cn("font-medium", tierConfig.color)}>{currentTier}</span>
              <span className="font-medium text-cyan-400">{nextTier}</span>
            </div>
          </div>
        </BentoCard>

        {/* Eligibility Card */}
        <BentoCard
          className={cn(
            "p-6 flex flex-col items-center justify-center text-center space-y-5",
            "bg-gradient-to-b from-primary/8 to-card border-primary/25",
            "hover:border-primary/40 hover:shadow-[0_0_32px_hsl(var(--color-green-glow)/0.15)]",
            "transition-all duration-300"
          )}
        >
          {/* Animated icon ring */}
          <div className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-2xl",
            isEligible ? "bg-primary/20" : "bg-muted/30",
            "ring-2 ring-offset-2 ring-offset-card transition-all duration-300",
            isEligible ? "ring-primary/30" : "ring-border"
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
            className={buttonVariants({
              variant: "default",
              className: "w-full group",
            })}
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
        </BentoCard>
      </div>

      {/* ── Quick Stats Strip ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Total Earned"  value={totalTokens}     icon={Coins}      color="text-foreground" />
        <StatPill label="Remaining"     value={remainingTokens} icon={Zap}        color="text-primary"    />
        <StatPill label="Redeemed"      value={spentTokens}     icon={Gift}       color="text-destructive" />
        <StatPill label="To Next Tier"  value={pointsToNextTier} icon={Crown}     color="text-cyan-400"   />
      </div>

      {/* ── Secondary Row ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Progress */}
        <BentoCard className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Active Earning Period</h3>
          </div>
          <PeriodProgress
            periodName="Period 1 (P1)"
            startDate={periodStart}
            endDate={periodEnd}
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
            <span>
              Tokens earned in P1 freeze on{" "}
              <span className="font-semibold text-foreground">Jun 15, 2026</span> for the
              redemption snapshot. Redemptions use that locked balance.
            </span>
          </div>
        </BentoCard>

        {/* Token split bar */}
        <BentoCard className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Token Breakdown</p>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "Total Earned",  value: totalTokens,     color: "text-foreground",  barColor: "bg-muted-foreground/50", pct: 1                                    },
              { label: "Redeemed",      value: spentTokens,     color: "text-destructive", barColor: "bg-destructive/70",       pct: spentTokens / totalTokens             },
              { label: "Remaining",     value: remainingTokens, color: "text-primary",     barColor: "bg-primary",              pct: remainingTokens / totalTokens         },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-sm font-bold tabular-nums", item.color)}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.barColor)}
                    style={{ width: loading ? "0%" : `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* ── Recent Activity ─────────────────────────────── */}
      <BentoCard className="p-6">
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
      </BentoCard>
    </div>
  );
}
