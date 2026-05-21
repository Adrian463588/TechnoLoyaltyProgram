"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, TrendingUp, ChevronRight, ArrowUpRight, Clock, Gift, Zap, Coins } from "lucide-react";
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
      <motion.div variants={itemVariants} className="bento-span-12 md:bento-span-4">
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

      {/* Earning Streak Card */}
      <motion.div variants={itemVariants} className="bento-span-12 md:bento-span-4">
        <BentoCard
          interactive
          className={cn("h-full p-6", hoveredCard === "streak" && "border-primary shadow-md")}
          onMouseEnter={() => setHoveredCard("streak")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="pb-0">
            <h3 className="text-label flex items-center gap-2 mb-4 text-[--color-text-secondary]">
              <motion.div
                animate={{ rotate: hoveredCard === "streak" ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="h-[14px] w-[14px]" />
              </motion.div>
              Earning Streak
            </h3>
          </div>
          <div className="pt-0">
            <motion.p
              className="text-metric-hero text-[--color-text-primary]"
              animate={{ scale: hoveredCard === "streak" ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              5 Mos
            </motion.p>
            <div className="mt-6 space-y-2">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" data-testid="employee-dashboard-tier-progress">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: "60%" }}
                  animate={{ width: hoveredCard === "streak" ? "75%" : "60%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Keep going to maintain <span className="text-primary font-bold">{data.tier.charAt(0) + data.tier.slice(1).toLowerCase()}!</span>
              </p>
            </div>
          </div>
        </BentoCard>
      </motion.div>

      {/* Redemption Card */}
      <motion.div variants={itemVariants} className="bento-span-12 md:bento-span-4">
        <BentoCard
          interactive
          className={cn("h-full p-6", hoveredCard === "redemption" && "border-primary shadow-md")}
          onMouseEnter={() => setHoveredCard("redemption")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="pb-0">
            <h3 className="text-label flex items-center gap-2 mb-4 text-[--color-text-secondary]">
              <motion.div
                animate={{ y: hoveredCard === "redemption" ? [0, -3, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <ShoppingBag className="h-[14px] w-[14px]" />
              </motion.div>
              Redemption
            </h3>
          </div>
          <div className="pt-0">
            <motion.p
              className="text-metric-hero text-[--color-text-primary]"
              animate={{ scale: hoveredCard === "redemption" ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Ready
            </motion.p>
            <div className="mt-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => router.push("/employee/rewards")}
                  data-testid="employee-dashboard-redeem-button"
                >
                  Browse Catalog
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </BentoCard>
      </motion.div>

      {/* Token History */}
      <motion.div variants={itemVariants} className="bento-span-8">
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
                  transactions.slice(0, 3).map((item, index) => {
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

      {/* Upcoming Rewards */}
      <motion.div variants={itemVariants} className="bento-span-4">
        <BentoCard className="h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-card-title">Upcoming Rewards</h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              className="p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>
          <div>
            <div className="space-y-4">
              {upcomingRewards.map((reward, index) => (
                <motion.div
                  key={reward.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-xl bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-foreground">
                      {reward.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {reward.tokensNeeded} tokens
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${reward.progress}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {reward.progress}% complete
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Progress Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Next reward in</span>
                <span className="font-bold text-primary">250 tokens</span>
              </div>
            </motion.div>
          </div>
        </BentoCard>
      </motion.div>
    </motion.div>
  );
}
