"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/bento-card";
import { useCountUp } from "@/hooks/use-count-up";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PeriodProgress } from "@/components/shared/period-progress";
import { TierBadge, EmployeeStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import {
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
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EmployeeDashboardResponse } from "@/lib/api-client";
import { motion } from "framer-motion";

// ── Tier config ───────────────────────────────────────────────
const TIER_CONFIG = {
  SAPHIRE: { color: "text-slate-500",  bg: "bg-slate-50",    border: "border-slate-200",  glow: "shadow-slate-100",  min: 0    },
  EMERALD: { color: "text-green-600",  bg: "bg-green-50",    border: "border-green-200",  glow: "shadow-green-100",  min: 430  },
  RUBY:    { color: "text-red-600",    bg: "bg-red-50",      border: "border-red-200",    glow: "shadow-red-100",    min: 860  },
  DIAMOND: { color: "text-cyan-600",   bg: "bg-cyan-50",     border: "border-cyan-200",   glow: "shadow-cyan-100",   min: 1300 },
} as const;

type Tier = keyof typeof TIER_CONFIG;

// ── Minimalist 3D Icon Container ───────────────────────────────
function Icon3D({ icon: Icon, colorClass, bgClass, shadowClass }: { icon: React.ElementType, colorClass: string, bgClass: string, shadowClass: string }) {
  return (
    <div className={cn(
      "relative flex h-12 w-12 items-center justify-center rounded-2xl border",
      bgClass, colorClass, shadowClass, "border-white/40 overflow-hidden"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-50" />
      <Icon className="relative z-10 w-6 h-6" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))" }} />
    </div>
  );
}

// ── Minimalist Chart Placeholder ─────────────────────────────
function MiniChart({ color = "bg-primary" }: { color?: string }) {
  return (
    <div className="flex items-end justify-between h-20 w-full mt-2 gap-2">
      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
        <div
          key={i}
          className={cn("w-full rounded-t-md opacity-80 animate-bar-grow", color)}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 100}ms`,
            animationFillMode: "both",
          }}
        />
      ))}
    </div>
  );
}

// ── ActivityRow ───────────────────────────────────────────────
function ActivityRow({
  type, amount, date, sign, delay, id,
}: {
  type: string; amount: number; date: string; sign: "+" | "-"; delay: number; id: string;
}) {
  const isGain = sign === "+";
  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl px-4 py-3",
        "transition-all duration-200 hover:bg-white hover:shadow-sm cursor-default border border-transparent hover:border-slate-100",
        "animate-fade-up-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`employee-dashboard-activity-${id}`}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm border",
        isGain ? "bg-primary/5 text-primary border-primary/20 shadow-[0_2px_10px_rgba(37,99,235,0.1)]" : "bg-destructive/5 text-destructive border-destructive/20 shadow-[0_2px_10px_rgba(239,68,68,0.1)]"
      )}>
        {isGain ? <TrendingUp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{type}</p>
        <p className="text-xs font-medium text-muted-foreground">{date}</p>
      </div>
      <div className="text-right">
        <span className={cn(
          "font-black tabular-nums text-base flex items-center gap-1.5 justify-end",
          isGain ? "text-primary" : "text-destructive"
        )}>
          {sign}{amount.toLocaleString()} <Coins className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

// ── Custom Calendar Widget ───────────────────────────────────────
function CalendarWidget() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-foreground">May 2026</h4>
        <div className="flex gap-2">
          <span className="w-6 h-6 flex justify-center items-center rounded bg-muted/50 text-xs font-semibold cursor-pointer hover:bg-muted">&lt;</span>
          <span className="w-6 h-6 flex justify-center items-center rounded bg-muted/50 text-xs font-semibold cursor-pointer hover:bg-muted">&gt;</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
        ))}
        {/* Placeholder days */}
        {Array.from({ length: 31 }).map((_, i) => {
          const isToday = i === 10; // May 11
          const isCutoff = i === 14; // Mid-month cutoff example
          return (
            <div key={i} className={cn(
              "flex h-7 w-7 mx-auto items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer",
              isToday ? "bg-primary text-white shadow-md shadow-primary/30 scale-110" : "text-foreground hover:bg-slate-100",
              isCutoff ? "border border-destructive text-destructive bg-destructive/5" : ""
            )}>
              {i + 1}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mid-Month Cutoff (15th)</span>
      </div>
    </div>
  )
}

// ── Content Component ─────────────────────────────────────────
export function EmployeeDashboardContent({ data }: { data: EmployeeDashboardResponse }) {
  const [progressValue, setProgressValue] = useState(0);

  const { tokenSummary, recentRedemptions } = data;
  const totalTokens      = tokenSummary.totalTokens;
  const currentTier      = tokenSummary.currentTier as Tier;
  const pointsToNextTier = tokenSummary.pointsToNextTier;
  const employeeStatus   = tokenSummary.memberStatus;
  const isEligible       = tokenSummary.isEligibleForReward;
  const tierConfig       = TIER_CONFIG[currentTier];

  // Logic for next tier
  const tierOrder: Tier[] = ["SAPHIRE", "EMERALD", "RUBY", "DIAMOND"];
  const currentIdx        = tierOrder.indexOf(currentTier);
  const nextTier          = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
  const currentTierMin    = TIER_CONFIG[currentTier].min;
  const nextTierMin       = nextTier ? TIER_CONFIG[nextTier].min : null;

  // BUG-009 FIX: Calculate progress relative to current tier band, not absolute tokens.
  // Example: 500 tokens, EMERALD(430) → RUBY(860): (500-430)/(860-430) = 16% — correct.
  // Old code: 500/860 = 58% — inflated and misleading.
  const progressPercent = nextTierMin
    ? Math.min(100, Math.max(0, ((totalTokens - currentTierMin) / (nextTierMin - currentTierMin)) * 100))
    : 100;

  const totalForNextTier = nextTierMin ?? totalTokens;

  const periodStart = new Date("2025-12-16");
  const periodEnd   = new Date("2026-06-15");

  const animatedTokens = useCountUp(totalTokens, 1400);

  useEffect(() => {
    const t = setTimeout(() => {
      setProgressValue(progressPercent);
    }, 200);
    return () => clearTimeout(t);
  }, [progressPercent]);

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-6 animate-fade-up-in">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            Welcome, {data.user.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium tracking-wide">
            Your high-fidelity loyalty overview for <span className="font-bold text-foreground">this period</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <EmployeeStatusBadge status={employeeStatus === "ACTIVE" ? "Active" : "Inactive"} />
          <TierBadge tier={currentTier} />
        </div>
      </div>

      {/* ── Advanced Bento Grid (12 cols) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Token Hero Card (Span 8) */}
        <GlassCard
          variant="elevated"
          glow={true}
          className="md:col-span-8 lg:col-span-8 p-8 flex flex-col justify-between min-h-[340px] relative overflow-hidden group"
        >
          {/* Subtle background abstract shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start gap-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm backdrop-blur-md">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Total Tokens Earned</span>
              </div>
              <h2
                className="text-8xl lg:text-[120px] font-black tracking-tighter text-foreground tabular-nums leading-none"
                data-testid="employee-dashboard-total-tokens-value"
                style={{ filter: "drop-shadow(0 10px 30px rgba(37,99,235,0.15))" }}
              >
                {animatedTokens.toLocaleString()}
              </h2>
              <p className="text-base text-muted-foreground font-medium">
                You have accumulated <span className="font-bold text-primary">{totalTokens.toLocaleString()}</span> tokens in your lifetime balance.
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-3">
              <div className={cn(
                "flex flex-col items-center justify-center p-5 rounded-2xl border shadow-xl backdrop-blur-xl min-w-[120px]",
                tierConfig.bg, tierConfig.border
              )}>
                <Crown className={cn("w-10 h-10 mb-2 drop-shadow-md", tierConfig.color)} />
                <span className={cn("text-xl font-black tracking-tight", tierConfig.color)}>{currentTier}</span>
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="relative z-10 mt-auto pt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <TrendingUp className="w-4 h-4 text-primary drop-shadow-sm" />
                {nextTier ? `Progress to ${nextTier}` : "Max Tier Reached"}
              </span>
              <span className="font-black text-foreground tabular-nums text-sm">
                {nextTier ? `${pointsToNextTier.toLocaleString()} more needed` : "Top tier excellence"}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={progressValue}
                className="h-4 transition-all duration-1000 ease-out bg-slate-200/50 shadow-inner"
                data-testid="employee-dashboard-tier-progress"
              />
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${progressValue}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
              <span className={cn(tierConfig.color)}>{currentTier}</span>
              {nextTier && <span className="text-blue-600">{nextTier}</span>}
            </div>
          </div>
        </GlassCard>

        {/* Eligibility Card (Span 4) */}
        <GlassCard
          variant="default"
          glow={isEligible}
          className="md:col-span-4 lg:col-span-4 p-8 flex flex-col items-center justify-center text-center space-y-6"
        >
          <Icon3D 
            icon={isEligible ? Sparkles : LockKeyhole} 
            colorClass={isEligible ? "text-white" : "text-slate-400"}
            bgClass={isEligible ? "bg-primary" : "bg-slate-100"}
            shadowClass={isEligible ? "shadow-[0_15px_35px_rgba(37,99,235,0.4)]" : "shadow-md"}
          />

          <div className="space-y-2">
            <h3 className="font-black text-2xl text-foreground tracking-tight">
              {isEligible ? "Ready to Redeem!" : "Locked Status"}
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed px-2">
              {isEligible
                ? "Your reward catalog is unlocked. Discover premium items."
                : "Earn 2,000+ tokens to unlock the exclusive reward catalog."}
            </p>
          </div>

          <Link
            href="/employee/rewards"
            className={buttonVariants({ variant: isEligible ? "default" : "outline", size: "lg", className: "w-full group font-bold uppercase tracking-widest text-xs h-12 shadow-xl shadow-primary/20" })}
            data-testid="employee-dashboard-redeem-button"
          >
            {isEligible ? "View Catalog" : "Check Requirements"}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </GlassCard>

        {/* ── Row 2 ─────────────────────────────────── */}

        {/* Analytics Mini Chart (Span 4) */}
        <GlassCard className="md:col-span-4 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">Token Growth</h3>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Past 7 Months trends</p>
            </div>
            <div className="p-2 bg-vivid-green/10 rounded-lg text-vivid-green font-bold text-xs">+14%</div>
          </div>
          <MiniChart color="bg-primary" />
        </GlassCard>

        {/* Calendar Widget (Span 4) */}
        <GlassCard className="md:col-span-4 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">Schedule</h3>
          </div>
          <CalendarWidget />
        </GlassCard>

        {/* Task List (Span 4) */}
        <GlassCard className="md:col-span-4 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg text-foreground">Pending Actions</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
              <Circle className="w-5 h-5 text-muted-foreground/50 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground leading-none">Review Q1 Sprint</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-widest">Due May 15</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
              <CheckCircle2 className="w-5 h-5 text-vivid-green mt-0.5" />
              <div>
                <p className="text-sm font-bold text-muted-foreground line-through leading-none">Submit Timesheet</p>
                <p className="text-[10px] text-vivid-green font-semibold mt-1 uppercase tracking-widest">Completed</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Row 3 ─────────────────────────────────── */}

        {/* Recent Activity (Span 8) */}
        <GlassCard className="md:col-span-8 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="font-black text-xl text-foreground flex items-center gap-3 tracking-tight">
              <Icon3D icon={History} colorClass="text-slate-600" bgClass="bg-slate-100" shadowClass="shadow-sm" />
              Ledger History
            </h3>
            <Link
              href="/employee/history"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "font-bold uppercase tracking-widest text-[10px]" })}
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentRedemptions.length > 0 ? (
              recentRedemptions.map((redemption, i) => (
                <ActivityRow
                  key={redemption.id}
                  id={redemption.id}
                  type={redemption.item.name}
                  amount={redemption.item.tokenCost}
                  date={new Date(redemption.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                  sign="-"
                  delay={i * 80}
                />
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No recent ledger activity.</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Period Progress (Span 4) */}
        <GlassCard className="md:col-span-4 p-6 space-y-6 flex flex-col justify-between bg-primary/[0.03] border-primary/10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Icon3D icon={Timer} colorClass="text-primary" bgClass="bg-white" shadowClass="shadow-md" />
              <h3 className="font-black text-xl text-foreground tracking-tight">Active Period</h3>
            </div>
            <PeriodProgress
              periodName={"Current Period"}
              startDate={periodStart}
              endDate={periodEnd}
              className="mt-6"
            />
          </div>
          <div className="flex items-start gap-3 text-xs text-primary/80 bg-primary/10 rounded-2xl p-4 border border-primary/20 shadow-inner">
            <Info className="w-5 h-5 shrink-0" />
            <span className="font-medium leading-relaxed">
              Tokens earned in this period freeze at the cut-off date. All unsubmitted slots will be lost.
            </span>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
