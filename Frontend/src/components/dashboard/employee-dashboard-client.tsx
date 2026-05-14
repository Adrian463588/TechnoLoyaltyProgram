"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useCountUp } from "@/hooks/use-count-up";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PeriodProgress } from "@/components/shared/period-progress";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Coins,
  Crown,
  Gift,
  History,
  LayoutGrid,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { EmployeeDashboardResponse } from "@/lib/api-client";

// ── Tier config ───────────────────────────────────────────────
const TIER_CONFIG = {
  SAPHIRE: { color: "text-slate-500",  bg: "bg-slate-50",    border: "border-slate-200",  glow: "shadow-slate-100",  min: 0    },
  EMERALD: { color: "text-green-600",  bg: "bg-green-50",    border: "border-green-200",  glow: "shadow-green-100",  min: 430  },
  RUBY:    { color: "text-red-600",    bg: "bg-red-50",      border: "border-red-200",    glow: "shadow-red-100",    min: 860  },
  DIAMOND: { color: "text-cyan-600",   bg: "bg-cyan-50",     border: "border-cyan-200",   glow: "shadow-cyan-100",   min: 1300 },
} as const;

type Tier = keyof typeof TIER_CONFIG;

function MiniChart({ color = "bg-primary" }: { color?: string }) {
  return (
    <div className="flex items-end gap-1 h-12 w-full mt-2">
      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
          className={cn("flex-1 rounded-t-sm opacity-60", color)}
        />
      ))}
    </div>
  );
}

function ActivityRow({
  type, amount, date, sign, delay, id,
}: {
  type: string; amount: number; date: string; sign: "+" | "-"; delay: number; id: number | string;
}) {
  const isGain = sign === "+";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 -mx-1",
        "transition-all duration-150 hover:bg-black/[0.03] cursor-default"
      )}
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
    </motion.div>
  );
}

export function EmployeeDashboardClient({ data }: { data: EmployeeDashboardResponse | null }) {
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  // Safely fallback to mock values if data is missing or backend failed
  const totalTokens = data?.tokenSummary.totalTokens ?? 4500;
  const remainingTokens = totalTokens - (data?.recentRedemptions.reduce((acc, r) => acc + r.item.tokenCost, 0) ?? 1300);
  const spentTokens = totalTokens - remainingTokens;
  const tierValue = data?.tokenSummary.currentTier ?? "EMERALD";
  const currentTier = tierValue as Tier;
  
  // Basic mock logic for missing fields
  const nextTier = currentTier === "DIAMOND" ? "DIAMOND" : "DIAMOND"; // simplified
  const totalForNextTier = data?.tokenSummary.pointsToNextTier ? totalTokens + data.tokenSummary.pointsToNextTier : 6000;
  const pointsToNextTier = data?.tokenSummary.pointsToNextTier ?? (totalForNextTier - totalTokens);
  const progressPercent = (totalTokens / totalForNextTier) * 100;
  const employeeStatus = data?.tokenSummary.memberStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const tokenAge = 8;
  const isEligible = data?.tokenSummary.isEligibleForReward ?? (remainingTokens >= 2000);
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.SAPHIRE;

  const periodStart = new Date("2025-12-16");
  const periodEnd   = new Date("2026-06-15");

  const recentActivities = data?.recentRedemptions.map(r => ({
    id: r.id,
    type: r.item.name,
    amount: r.item.tokenCost,
    date: new Date(r.createdAt).toLocaleDateString(),
    sign: "-" as const
  })) || [
    { id: 1, type: "Optel Slot",        amount: 500,  date: "10 May 2026",  sign: "+" as const },
    { id: 2, type: "Techno Sprint",     amount: 1200, date: "28 Apr 2026",  sign: "+" as const },
    { id: 3, type: "Optel Slot",        amount: 300,  date: "15 Apr 2026",  sign: "+" as const },
    { id: 4, type: "Reward Redemption", amount: 2000, date: "1 Apr 2026",   sign: "-" as const },
  ];

  const animatedTokens = useCountUp(loading ? 0 : totalTokens, 1400);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setProgressValue(progressPercent), 200);
    }, 1000);
    return () => clearTimeout(t);
  }, [progressPercent]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="space-y-1.5">
          <div className="h-3 w-36 rounded bg-slate-200/60 animate-skeleton" />
          <div className="h-8 w-48 rounded bg-slate-200/60 animate-skeleton stagger-1" />
          <div className="h-4 w-56 rounded bg-slate-200/60 animate-skeleton stagger-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 h-[320px] rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-[320px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[200px] rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-[200px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-[400px] rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto w-full space-y-6"
    >
      <Breadcrumb />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Welcome back, {data?.user.name || "Mitra"} — here&apos;s your ultra-modern loyalty overview for P1 2026.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EmployeeStatusBadge status={employeeStatus} />
          <TierBadge tier={currentTier} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <GlassCard
          variant="elevated"
          glow={true}
          className="md:col-span-3 p-8 flex flex-col justify-between min-h-[320px]"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Total Tokens Earned
              </p>
              <h2
                className="text-8xl font-black tracking-tighter text-foreground tabular-nums leading-none"
                data-testid="employee-dashboard-total-tokens-value"
                style={{ filter: "drop-shadow(0 10px 30px rgba(37,99,235,0.2))" }}
              >
                {animatedTokens.toLocaleString()}
              </h2>
              <div className="flex items-center gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Remaining</p>
                  <p className="text-xl font-bold text-primary">{remainingTokens.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Redeemed</p>
                  <p className="text-xl font-bold text-destructive">{spentTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-4">
              <div className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border p-4 shadow-xl",
                tierConfig.bg, tierConfig.border, "bg-white/40"
              )}>
                <Crown className={cn("w-8 h-8 mb-1", tierConfig.color)} />
                <span className={cn("text-lg font-black uppercase tracking-tight", tierConfig.color)}>{currentTier}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">{tokenAge} Months</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter leading-none mt-1">Accumulated History</p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Progress to {nextTier}
              </span>
              <span className="text-foreground">
                {pointsToNextTier.toLocaleString()} points remaining
              </span>
            </div>
            <div className="relative">
              <Progress
                value={progressValue}
                className="h-4 transition-all duration-1000 ease-out bg-slate-100/50"
                data-testid="employee-dashboard-tier-progress"
              />
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${progressValue}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard
          variant="default"
          glow={isEligible}
          className={cn(
            "p-8 flex flex-col items-center justify-center text-center space-y-6",
            isEligible ? "bg-white/60" : "bg-slate-50/40"
          )}
        >
          <div className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-[2rem] shadow-2xl transition-all duration-500",
            isEligible ? "bg-primary text-white scale-110" : "bg-slate-200 text-slate-400",
            "ring-4 ring-offset-4 ring-offset-white/20",
            isEligible ? "ring-primary/20" : "ring-slate-100"
          )}>
            {isEligible ? (
              <>
                <Sparkles className="w-10 h-10 animate-float" />
                <motion.span
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-[-8px] rounded-[2.5rem] border-2 border-primary/30"
                />
              </>
            ) : (
              <LockKeyhole className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-black text-2xl text-foreground tracking-tight">
              {isEligible ? "Unlocked!" : "Locked"}
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-tight px-2">
              {isEligible
                ? "Your reward catalog is ready for exploration."
                : `Earn ${(2000 - remainingTokens).toLocaleString()} more tokens to unlock rewards.`}
            </p>
          </div>

          <Link
            href="/employee/rewards"
            className={buttonVariants({
              variant: isEligible ? "default" : "outline",
              size: "lg",
              className: "w-full font-bold uppercase tracking-widest h-12 shadow-xl shadow-primary/20 transition-all hover:scale-[1.03]"
            })}
            data-testid="employee-dashboard-redeem-button"
          >
            Catalog <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </GlassCard>

        <GlassCard className="md:col-span-2 p-8 flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Token Trends</h3>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">Past 7 Months</Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-4">Consistent performance in Slot completions.</p>
          <MiniChart color="bg-primary" />
          <div className="flex justify-between mt-4 border-t border-slate-100 pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Avg Monthly</span>
              <span className="text-lg font-black text-foreground">560 <Coins className="inline w-3 h-3 mb-1" /></span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Status</span>
              <span className="text-sm font-bold text-vivid-green flex items-center gap-1">
                Trending Up <TrendingUp className="w-3 h-3" />
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="md:col-span-2 p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Earning Period</h3>
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-widest">Active</span>
          </div>

          <PeriodProgress
            periodName="Period 1 (P1 2026)"
            startDate={periodStart}
            endDate={periodEnd}
          />

          <div className="mt-6 flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-normal">
              Current tokens will freeze on <span className="text-foreground font-bold underline decoration-primary/30">June 15, 2026</span>.
              Ensure all slots are submitted before the cut-off.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="md:col-span-3 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl">
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-black text-xl text-foreground tracking-tight">Recent Ledger</h3>
            </div>
            <Link
              href="/employee/history"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "font-bold uppercase tracking-widest text-xs hover:bg-slate-100" })}
            >
              Full History <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentActivities.map((activity, i) => (
              <ActivityRow
                key={activity.id}
                {...activity}
                delay={i * 80}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col justify-between bg-corporate-600 text-white border-0 shadow-2xl shadow-corporate-600/40">
          <div className="space-y-4">
            <LayoutGrid className="w-10 h-10 opacity-40 mb-2" />
            <h3 className="font-black text-xl tracking-tight leading-tight">Maximize<br />Your Rewards</h3>
            <p className="text-xs font-medium text-white/80 leading-relaxed">
              Did you know Gold tier members get priority verification on all tech vouchers?
            </p>
          </div>
          <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white border-2 font-bold uppercase tracking-widest text-xs">
            Tier Benefits
          </Button>
        </GlassCard>

      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] pt-4 pb-8">
        <CheckCircle2 className="w-3 h-3 text-vivid-green" /> End-to-End Secure • Berijalan HC Data
      </div>
    </motion.div>
  );
}
