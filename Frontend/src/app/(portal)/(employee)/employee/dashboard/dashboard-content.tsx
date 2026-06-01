"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, TrendingUp, ChevronRight, ArrowUpRight, Clock, Gift, Zap, Coins, ShieldCheck, MapPin, Calendar, Users } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TokenHeroSection } from "@/components/dashboard/token-hero-section";
import { DashboardClock } from "@/components/dashboard/dashboard-clock";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";
import { RedemptionQueueTable } from "@/features/admin/redemption-queue-table";

interface TokenLedgerEntry {
  id: string;
  eventType: string;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  createdAt: string;
}

interface DashboardData {
  tokenBalance: number;
  tier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  eligibilityStatus: { eligible: boolean; reason?: string };
  period: string;
  recentTransactions?: TokenLedgerEntry[];
  settings: import("@/lib/api-client").SystemSettingsResponse | null;
  teamTierDistribution?: {
    SAPHIRE: number;
    EMERALD: number;
    RUBY: number;
    DIAMOND: number;
  };
  teamTotalTokens?: number;
  teamRedemptions?: any[] | null;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const getEventMetadata = (type: string) => {
  switch (type) {
    case "EARNED_SHIFT":
      return { title: "Monthly Token Award", icon: TrendingUp };
    case "EARNED_PROJECT":
      return { title: "Project Completion Bonus", icon: Gift };
    case "REDEEMED":
      return { title: "Reward Redemption", icon: ShoppingBag };
    case "MANUAL_ADJUSTMENT":
      return { title: "Token Adjustment", icon: Coins };
    case "DOWNGRADE_PENALTY":
      return { title: "Tier Downgrade", icon: Clock };
    case "RESET_PENALTY":
      return { title: "Period Reset", icon: Clock };
    case "EXPIRED":
      return { title: "Token Expired", icon: Clock };
    default:
      return { title: "Token Transaction", icon: Zap };
  }
};

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
};

export function DashboardContent({ data, userName }: { data: DashboardData; userName?: string }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const transactions = data.recentTransactions || [];

  // ── Dynamic Period Logic (Mirrored from Admin) ──────────────────────────
  const now = new Date();
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  let activePeriodLabel = "Unknown";
  let activePeriodDates = "";
  let activeClaimLabel = "Unknown";
  let activeClaimDates = "";

  if (data.settings) {
    const { p1Start, p1End, p2Start, p2End, claimP1Start, claimP1End, claimP2Start, claimP2End } = data.settings;
    
    const formatDateStr = (mmdd: string) => {
      const [m, d] = mmdd.split("-");
      const date = new Date(2000, parseInt(m) - 1, parseInt(d));
      return date.toLocaleString('en-GB', { month: 'short', day: 'numeric' });
    };

    const p1RangeStr = `${formatDateStr(p1Start)} → ${formatDateStr(p1End)}`;
    const p2RangeStr = `${formatDateStr(p2Start)} → ${formatDateStr(p2End)}`;
    const claimP1RangeStr = `${formatDateStr(claimP1Start)} → ${formatDateStr(claimP1End)}`;
    const claimP2RangeStr = `${formatDateStr(claimP2Start)} → ${formatDateStr(claimP2End)}`;

    // Earning Period Logic
    if (p1Start <= p1End) {
      if (currentMonthDay >= p1Start && currentMonthDay <= p1End) {
        activePeriodLabel = "P1";
        activePeriodDates = p1RangeStr;
      }
    } else {
      if (currentMonthDay >= p1Start || currentMonthDay <= p1End) {
        activePeriodLabel = "P1";
        activePeriodDates = p1RangeStr;
      }
    }

    if (activePeriodLabel === "Unknown") {
      if (p2Start <= p2End) {
        if (currentMonthDay >= p2Start && currentMonthDay <= p2End) {
          activePeriodLabel = "P2";
          activePeriodDates = p2RangeStr;
        }
      } else {
        if (currentMonthDay >= p2Start || currentMonthDay <= p2End) {
          activePeriodLabel = "P2";
          activePeriodDates = p2RangeStr;
        }
      }
    }

    // Claim Period Logic
    if (claimP1Start <= claimP1End) {
      if (currentMonthDay >= claimP1Start && currentMonthDay <= claimP1End) {
        activeClaimLabel = "P1";
        activeClaimDates = claimP1RangeStr;
      }
    } else {
      if (currentMonthDay >= claimP1Start || currentMonthDay <= claimP1End) {
        activeClaimLabel = "P1";
        activeClaimDates = claimP1RangeStr;
      }
    }

    if (activeClaimLabel === "Unknown") {
      if (claimP2Start <= claimP2End) {
        if (currentMonthDay >= claimP2Start && currentMonthDay <= claimP2End) {
          activeClaimLabel = "P2";
          activeClaimDates = claimP2RangeStr;
        }
      } else {
        if (currentMonthDay >= claimP2Start || currentMonthDay <= claimP2End) {
          activeClaimLabel = "P2";
          activeClaimDates = claimP2RangeStr;
        }
      }
    }

    if (activeClaimLabel === "Unknown") {
      activeClaimLabel = "P1";
      activeClaimDates = claimP1RangeStr;
    }
  }

  // ── Helper logic for countdowns ─────────────────────────────────────────
  const getDaysDiff = (targetMMDD: string) => {
    const [m, d] = targetMMDD.split("-").map(Number);
    const targetDate = new Date(now.getFullYear(), m - 1, d);
    
    // If target date is in the past for this month, and we might be looking at next month 
    // (simplified for current year logic)
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  let earningStatusText = "Phase Finished";
  let claimingStatusText = "Upcoming Phase";
  let isClaimingActive = false;

  if (data.settings) {
    const { p1End, p2End, claimP1Start, claimP1End, claimP2Start, claimP2End } = data.settings;
    
    // Earning Countdown
    const currentEarningEnd = activePeriodLabel === "P1" ? p1End : p2End;
    const daysLeftEarning = getDaysDiff(currentEarningEnd);
    if (daysLeftEarning > 0) {
      earningStatusText = `${daysLeftEarning} days remaining`;
    } else if (daysLeftEarning === 0) {
      earningStatusText = "Last day to earn!";
    }

    // Claiming Countdown
    const currentClaimStart = activeClaimLabel === "P1" ? claimP1Start : claimP2Start;
    const currentClaimEnd   = activeClaimLabel === "P1" ? claimP1End   : claimP2End;
    
    const daysUntilClaim = getDaysDiff(currentClaimStart);
    const daysLeftClaim  = getDaysDiff(currentClaimEnd);

    if (daysUntilClaim > 0) {
      claimingStatusText = `Starts in ${daysUntilClaim} days`;
    } else if (daysLeftClaim >= 0) {
      claimingStatusText = `${daysLeftClaim === 0 ? "Last day" : daysLeftClaim + " days"} remaining`;
      isClaimingActive = true;
    } else {
      claimingStatusText = "Phase Finished";
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bento-grid"
    >
      {/* Welcome Banner Card */}
      <motion.div
        variants={itemVariants}
        className="bento-span-12 bento-card p-8 flex flex-col md:flex-row md:items-start justify-between animate-fade-up-in"
      >
        <div className="flex flex-col">
          <motion.h1
            data-testid="employee-dashboard-heading"
            className="text-2xl font-extrabold text-[--color-text-secondary] leading-none mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            className="text-sm text-[--color-text-secondary] font-medium leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back, <span className="font-bold">{userName}</span>! Here's an overview of your loyalty status.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 md:mt-0"
        >
          <DashboardClock />
        </motion.div>
      </motion.div>

      {/* Row 2: Stats Grid */}
      <div className="bento-span-12 grid grid-cols-12 gap-4">
        {/* Token Balance Card */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 h-full">
          <div
            onMouseEnter={() => setHoveredCard("tokens")}
            onMouseLeave={() => setHoveredCard(null)}
            className="h-full"
          >
            <TokenHeroSection
              tokenBalance={data.teamTotalTokens !== undefined && data.teamTotalTokens !== null ? data.teamTotalTokens : data.tokenBalance}
              tier={data.tier}
              eligibilityStatus={data.eligibilityStatus}
            />
          </div>
        </motion.div>

        {/* Dynamic Tier Card / Team Tier Distribution */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 h-full">
          {data.teamTierDistribution ? (
            <BentoCard className="h-full p-6 relative overflow-hidden bg-white border-[var(--color-border-subtle)] shadow-sm group">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60 text-slate-400">
                    TEAM TIER DISTRIBUTION
                  </h3>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-4">
                  {[
                    { label: "Saphire", key: "SAPHIRE", color: "bg-blue-500", text: "text-blue-600" },
                    { label: "Emerald", key: "EMERALD", color: "bg-emerald-500", text: "text-emerald-600" },
                    { label: "Ruby",    key: "RUBY",    color: "bg-red-500",     text: "text-red-600" },
                    { label: "Diamond", key: "DIAMOND", color: "bg-purple-500",  text: "text-purple-600" },
                  ].map((tier) => {
                    const count = data.teamTierDistribution![tier.key as keyof typeof data.teamTierDistribution] || 0;
                    const total = Object.values(data.teamTierDistribution!).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div key={tier.key} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", tier.text)}>{tier.label}</span>
                          <span className="text-xs font-black text-slate-700">{count} Members</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", tier.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-[0.04] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-1000 pointer-events-none text-slate-900">
                <Users size={160} />
              </div>
            </BentoCard>
          ) : (
            (() => {
              const tier = data.tier.toUpperCase();
              const config = {
                SAPHIRE: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-700", accent: "bg-blue-600", light: "bg-blue-100" },
                EMERALD: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", accent: "bg-emerald-600", light: "bg-emerald-100" },
                RUBY:    { bg: "bg-red-50/50", border: "border-red-100", text: "text-red-700", accent: "bg-red-600", light: "bg-red-100" },
                DIAMOND: { bg: "bg-purple-50/50", border: "border-purple-100", text: "text-purple-700", accent: "bg-purple-600", light: "bg-purple-100" },
              }[tier] || { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-700", accent: "bg-slate-600", light: "bg-slate-100" };

              return (
                <div className={cn("bento-card h-full p-6 relative overflow-hidden group transition-all duration-500", config.bg, config.border)}>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-baseline justify-between mb-4">
                      <h3 className={cn("text-[10px] font-black tracking-[0.2em] uppercase opacity-60", config.text)}>
                        YOUR TIER IS
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 mb-12">
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", config.light)}>
                        <ShieldCheck className={cn("h-8 w-8", config.text)} />
                      </div>
                      <p className={cn("text-3xl font-black tracking-tighter uppercase", config.text)}>
                        {data.tier}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-70", config.text)}>Retention Status</span>
                        <span className={cn("text-[10px] font-black uppercase", config.text)}>Secured</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", config.accent)}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <p className={cn("text-[10px] mt-2 font-medium opacity-60", config.text)}>
                        Benefits are active for next period.
                      </p>
                  </div>

                  <div className="absolute -bottom-6 -right-6 opacity-[0.04] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-1000 pointer-events-none text-slate-900">
                    <ShieldCheck size={160} />
                  </div>
                </div>
              );
            })()
          )}
        </motion.div>

        {/* Schedule Info Card (Opsi 1 Revised) */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 h-full">
          <BentoCard className="h-full p-6 relative overflow-hidden border-slate-200 bg-white group">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
                  CURRENT CYCLE : {activePeriodLabel}
                </h3>
              </div>


              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Earning Phase */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Earning</span>
                  </div>
                  <p className="text-sm font-black text-slate-600 leading-none">{activePeriodDates}</p>
                  <p className="text-[10px] font-bold text-slate-400">{earningStatusText}</p>
                </div>

                {/* Claim Phase */}
                <div className="space-y-2 border-l border-slate-100 pl-4">
                  <div className={cn("flex items-center gap-2", isClaimingActive ? "text-primary" : "text-slate-400")}>
                    <Gift size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Claiming</span>
                  </div>
                  <p className={cn("text-sm font-black leading-none", isClaimingActive ? "text-slate-900" : "text-slate-600")}>
                    {activeClaimDates}
                  </p>
                  <p className={cn("text-[10px] font-bold", isClaimingActive ? "text-primary animate-pulse" : "text-slate-400")}>
                    {claimingStatusText}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup Point</p>
                    <p className="text-xs font-bold text-slate-700">
                      {data.settings?.rewardPickupLocation || "Contact HC for pickup location"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 opacity-[0.04] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-1000 pointer-events-none text-slate-900">
              <Calendar size={160} />
            </div>
          </BentoCard>
        </motion.div>
      </div>

      {/* Token History / Redemption Queue */}
      <motion.div variants={itemVariants} className="bento-span-12">
        <BentoCard className="h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-600">
              {data.teamRedemptions ? "Team Redemption Queue" : "Token History"}
            </h3>
            <Button
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
              onClick={() => router.push(data.teamRedemptions ? "/leader/redemptions" : "/employee/history")}
            >
              View All
              <ChevronRight className="h-3 w-3 shrink-0" />
            </Button>
          </div>
          <div>
            {data.teamRedemptions ? (
              <RedemptionQueueTable initialRequests={data.teamRedemptions} />
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 5).map((item, index) => {
                      const metadata = getEventMetadata(item.eventType);
                      const Icon = metadata.icon;
                      const isAddition = item.amount > 0;
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01, backgroundColor: "var(--color-bg-subtle)" }}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer"
                          data-testid={`employee-dashboard-activity-${item.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                                isAddition 
                                  ? "bg-success/10 text-success" 
                                  : "bg-error/10 text-error"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {item.reason || metadata.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(item.createdAt)}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <span className={cn(
                              "text-sm font-bold", 
                              isAddition ? "text-success" : "text-error"
                            )}>
                              {isAddition ? `+${item.amount}` : item.amount}
                            </span>
                          </motion.div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions yet
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </BentoCard>
      </motion.div>
    </motion.div>
  );
}
