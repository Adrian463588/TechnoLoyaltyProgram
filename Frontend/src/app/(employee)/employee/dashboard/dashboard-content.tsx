"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, TrendingUp, ChevronRight, ArrowUpRight, Clock, Gift, Zap, Coins, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TokenHeroSection } from "@/components/dashboard/token-hero-section";
import { DashboardClock } from "@/components/dashboard/dashboard-clock";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

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
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

const upcomingRewards = [
  { name: "Amazon Gift Card $50", progress: 75, tokensNeeded: 250 },
  { name: "Travel Voucher", progress: 45, tokensNeeded: 550 },
];

export function DashboardContent({ data }: { data: DashboardData }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const transactions = data.recentTransactions || [];

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
        className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-start justify-between"
      >
        <div>
          <motion.h1
            data-testid="employee-dashboard-heading"
            className="text-2xl font-extrabold text-[--color-text-secondary] mb-3 leading-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            className="text-sm text-[--color-text-secondary] leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Active Earning Period: {data.period}
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

      {/* Token Balance Card */}
      <motion.div variants={itemVariants} className="bento-span-12 md:bento-span-6">
        <div
          onMouseEnter={() => setHoveredCard("tokens")}
          onMouseLeave={() => setHoveredCard(null)}
          className="h-full"
        >
          <TokenHeroSection
            tokenBalance={data.tokenBalance}
            tier={data.tier}
            eligibilityStatus={data.eligibilityStatus}
          />
        </div>
      </motion.div>

      {/* Your Tier Card - Dynamic Gemstone Style */}
      <motion.div variants={itemVariants} className="bento-span-12 md:bento-span-6">
        {(() => {
          const tier = data.tier.toUpperCase();
          const config = {
            SAPHIRE: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-700", accent: "bg-blue-600", light: "bg-blue-100" },
            EMERALD: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", accent: "bg-emerald-600", light: "bg-emerald-100" },
            RUBY:    { bg: "bg-red-50/50", border: "border-red-100", text: "text-red-700", accent: "bg-red-600", light: "bg-red-100" },
            DIAMOND: { bg: "bg-purple-50/50", border: "border-purple-100", text: "text-purple-700", accent: "bg-purple-600", light: "bg-purple-100" },
          }[tier] || { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-700", accent: "bg-slate-600", light: "bg-slate-100" };

          return (
            <div className={cn("bento-card h-full p-6 relative overflow-hidden", config.bg, config.border)}>
              <div className="relative z-10 flex flex-col h-full">
                <div className="pb-0">
                  <h3 className={cn("text-[10px] font-black tracking-[0.2em] uppercase mb-4 opacity-60", config.text)}>
                    YOUR TIER IS
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", config.light)}>
                    <ShieldCheck className={cn("h-8 w-8", config.text)} />
                  </div>
                  <p className={cn("text-4xl font-black tracking-tighter uppercase", config.text)}>
                    {data.tier}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-black/5">
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
                    Your {data.tier.toLowerCase()} benefits are active for the next period.
                  </p>
                </div>
              </div>

              {/* Decorative Background Icon */}
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none">
                <ShieldCheck size={160} />
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* Token History */}
      <motion.div variants={itemVariants} className="bento-span-12">
        <BentoCard className="h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-card-title">Token History</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
              onClick={() => router.push("/employee/history")}
            >
              View All
              <ChevronRight className="h-3 w-3 shrink-0" />
            </Button>
          </div>
          <div>
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
          </div>
        </BentoCard>
      </motion.div>
    </motion.div>
  );
}
