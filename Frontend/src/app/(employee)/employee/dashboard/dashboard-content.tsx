"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, TrendingUp, ChevronRight, ArrowUpRight, Clock, Gift } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TokenHeroSection } from "@/components/dashboard/token-hero-section";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import { cn } from "@/lib/utils";

interface DashboardData {
  tokenBalance: number;
  tier: "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";
  eligibilityStatus: { eligible: boolean; reason?: string };
  period: string;
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

const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const tokenHistoryData = [
  { id: 1, title: "Monthly Token Award", date: "Oct 2024", division: "Opcent Division", amount: 120, icon: TrendingUp },
  { id: 2, title: "Project Completion Bonus", date: "Sep 2024", division: "Techno Center", amount: 250, icon: Gift },
  { id: 3, title: "Shift Incentive", date: "Sep 2024", division: "Tele Division", amount: 80, icon: Clock },
];

const upcomingRewards = [
  { name: "Amazon Gift Card $50", progress: 75, tokensNeeded: 250 },
  { name: "Travel Voucher", progress: 45, tokensNeeded: 550 },
];

export function DashboardContent({ data }: { data: DashboardData }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bento-grid"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="bento-span-12 p-6 flex items-center justify-between"
      >
        <div>
          <motion.h1
            data-testid="employee-dashboard-heading"
            className="text-hero"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            className="text-body mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Active Earning Period: <span className="text-primary font-bold">{data.period}</span>
          </motion.p>
        </div>
        <motion.div
          variants={pulseVariants}
          initial="initial"
          animate="pulse"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Earning Active</span>
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
          <div className="pb-2">
            <h3 className="text-label flex items-center gap-2 text-primary">
              <motion.div
                animate={{ rotate: hoveredCard === "streak" ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="h-[14px] w-[14px]" />
              </motion.div>
              Earning Streak
            </h3>
          </div>
          <div className="pt-0 mt-4">
            <motion.p
              className="text-metric"
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
          <div className="pb-2">
            <h3 className="text-label flex items-center gap-2 text-primary">
              <motion.div
                animate={{ y: hoveredCard === "redemption" ? [0, -3, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <ShoppingBag className="h-[14px] w-[14px]" />
              </motion.div>
              Redemption
            </h3>
          </div>
          <div className="pt-0 mt-4">
            <motion.p
              className="text-metric"
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
              className="text-xs font-bold uppercase tracking-widest hover:bg-slate-50"
              onClick={() => router.push("/employee/history")}
            >
              View All
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {tokenHistoryData.map((item, index) => (
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
                        className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
                      >
                        <item.icon className="h-5 w-5 text-primary" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.date} • {item.division}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-1"
                    >
                      <span className="text-sm font-bold text-primary">
                        +{item.amount}
                      </span>
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </motion.div>
                  </motion.div>
                ))}
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
