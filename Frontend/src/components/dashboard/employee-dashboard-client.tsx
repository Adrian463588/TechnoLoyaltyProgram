"use client";

import { useEffect, useState } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { useCountUp } from "@/hooks/use-count-up";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Crown,
  Gift,
  LockKeyhole,
  Sparkles,
  TrendingUp,
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
        "transition-all duration-150 hover:bg-slate-50 cursor-default"
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

  const totalTokens = data?.tokenSummary.totalTokens ?? 4500;
  const remainingTokens = totalTokens - (data?.recentRedemptions.reduce((acc, r) => acc + r.item.tokenCost, 0) ?? 1300);
  const spentTokens = totalTokens - remainingTokens;
  const tierValue = data?.tokenSummary.currentTier ?? "EMERALD";
  const currentTier = tierValue as Tier;
  
  const nextTier = currentTier === "DIAMOND" ? "DIAMOND" : "DIAMOND";
  const totalForNextTier = data?.tokenSummary.pointsToNextTier ? totalTokens + data.tokenSummary.pointsToNextTier : 6000;
  const pointsToNextTier = data?.tokenSummary.pointsToNextTier ?? (totalForNextTier - totalTokens);
  const progressPercent = (totalTokens / totalForNextTier) * 100;
  const employeeStatus = data?.tokenSummary.memberStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const tokenAge = 8;
  const isEligible = data?.tokenSummary.isEligibleForReward ?? (remainingTokens >= 2000);
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.SAPHIRE;

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
      <div role="status" aria-label="Loading loyalty dashboard" aria-busy="true" className="bento-grid">
        <div className="bento-card bento-span-12 p-6 space-y-3">
          <div className="skeleton h-7 w-72" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>

        {[0, 1, 2].map((item) => (
          <div key={item} className="bento-card bento-span-4 p-6 space-y-5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-12 w-40" />
            <div className="skeleton h-4 w-56 max-w-full" />
          </div>
        ))}

        <div className="bento-card bento-span-8 p-6 space-y-4">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>

        <div className="bento-card bento-span-4 bento-row-2 p-6 space-y-4">
          <div className="skeleton h-5 w-40" />
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto w-full space-y-6 pb-12"
    >
      <Breadcrumb />
      
      <div className="bento-grid">
        <div className="bento-span-12 flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1 mb-2">
          <div>
            <h1 className="text-hero text-foreground">Dashboard</h1>
            <p className="text-body mt-1">
              Welcome back, {data?.user.name || "Mitra"} — here&apos;s your ultra-modern loyalty overview for P1 2026.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EmployeeStatusBadge status={employeeStatus} />
            <TierBadge tier={currentTier} />
          </div>
        </div>

        <BentoCard featured className="bento-span-4 p-6 flex flex-col justify-between min-h-[220px]">
          <div>
            <p className="text-label flex items-center gap-2 text-primary">
              <Coins className="w-4 h-4" />
              Total Tokens Earned
            </p>
            <h2
              className="text-metric mt-4"
              data-testid="employee-dashboard-total-tokens-value"
            >
              {animatedTokens.toLocaleString()}
            </h2>
          </div>
          <div className="flex items-center gap-4 mt-6 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Remaining</p>
              <p className="text-lg font-bold text-primary">{remainingTokens.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Redeemed</p>
              <p className="text-lg font-bold text-destructive">{spentTokens.toLocaleString()}</p>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="bento-span-4 p-6 flex flex-col items-center justify-center text-center">
           <div className={cn(
              "flex flex-col items-center gap-1 rounded-2xl p-4 w-full h-full justify-center",
              tierConfig.bg, tierConfig.border
            )}>
              <Crown className={cn("w-10 h-10 mb-2", tierConfig.color)} />
              <span className={cn("text-2xl font-black uppercase tracking-tight", tierConfig.color)}>{currentTier}</span>
              <p className="text-xs font-bold text-foreground uppercase tracking-widest mt-2">{tokenAge} Months History</p>
            </div>
        </BentoCard>

        <BentoCard className={cn(
            "bento-span-4 p-6 flex flex-col items-center justify-center text-center space-y-4",
            isEligible ? "bg-white" : "bg-slate-50"
          )}>
          <div className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-[2rem] transition-all duration-500",
            isEligible ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
          )}>
            {isEligible ? <Sparkles className="w-8 h-8" /> : <LockKeyhole className="w-8 h-8" />}
          </div>

          <div>
            <h3 className="text-card-title text-foreground tracking-tight">
              {isEligible ? "Unlocked!" : "Locked"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isEligible
                ? "Your reward catalog is ready."
                : `Earn ${(2000 - remainingTokens).toLocaleString()} more.`}
            </p>
          </div>

          <Link
            href="/employee/rewards"
            className={buttonVariants({
              variant: isEligible ? "default" : "outline",
              className: "w-full mt-2"
            })}
            data-testid="employee-dashboard-redeem-button"
          >
            Catalog <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </BentoCard>

        <BentoCard className="bento-span-8 p-6 flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-card-title text-foreground">Token Trends</h3>
            </div>
            <Badge variant="outline">Past 7 Months</Badge>
          </div>
          <p className="text-body mb-4">Consistent performance in Slot completions.</p>
          <MiniChart color="bg-primary" />
        </BentoCard>

        <BentoCard className="bento-span-4 bento-row-2 p-6 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-card-title text-foreground">Recent Ledger</h3>
            </div>
            <Link
              href="/employee/history"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Full History
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
        </BentoCard>

        <BentoCard className="bento-span-8 p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-label">
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
                className="h-4 transition-all duration-1000 ease-out bg-slate-100"
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
        </BentoCard>

      </div>

      <div className="flex items-center justify-center gap-2 text-label pt-4">
        <CheckCircle2 className="w-3 h-3 text-success" /> End-to-End Secure • Berijalan HC Data
      </div>
    </motion.div>
  );
}
