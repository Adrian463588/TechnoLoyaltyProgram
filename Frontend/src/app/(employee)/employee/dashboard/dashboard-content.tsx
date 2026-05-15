"use client";

import React, { useState } from "react";
import { ShoppingBag, TrendingUp, ChevronRight, ArrowUpRight, Clock, Gift } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TokenHeroSection } from "@/components/dashboard/token-hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        className="col-span-12 glass-card p-6 flex items-center justify-between"
      >
        <div>
          <motion.h1
            data-testid="employee-dashboard-heading"
            className="text-3xl font-bold tracking-tight text-[--color-text-primary]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dashboard
          </motion.h1>
          <motion.p
            className="text-[--color-text-secondary] text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Active Earning Period: <span className="text-[--color-accent]">{data.period}</span>
          </motion.p>
        </div>
        <motion.div
          variants={pulseVariants}
          initial="initial"
          animate="pulse"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[--color-accent-muted] border border-[--color-border-accent]"
        >
          <span className="h-2 w-2 rounded-full bg-[--color-accent] animate-pulse" />
          <span className="text-xs font-medium text-[--color-accent]">Earning Active</span>
        </motion.div>
      </motion.div>

      {/* Token Balance Card */}
      <motion.div variants={itemVariants} className="col-span-12 md:col-span-4">
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
      <motion.div variants={itemVariants}>
        <Card
          className={cn(
            "h-full bento-card transition-all duration-300 cursor-pointer",
            hoveredCard === "streak" && "border-[--color-accent]/30 shadow-lg shadow-[--color-accent]/10"
          )}
          onMouseEnter={() => setHoveredCard("streak")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2">
              <motion.div
                animate={{ rotate: hoveredCard === "streak" ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="h-[14px] w-[14px] text-[--color-accent]" />
              </motion.div>
              Earning Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <motion.p
              className="text-metric-hero text-[--color-text-primary]"
              animate={{ scale: hoveredCard === "streak" ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              5 Mos
            </motion.p>
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden" data-testid="employee-dashboard-tier-progress">
                <motion.div
                  className="h-full bg-gradient-to-r from-[--color-accent] to-[--color-accent-hover] rounded-full"
                  initial={{ width: "60%" }}
                  animate={{ width: hoveredCard === "streak" ? "75%" : "60%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-[--color-text-secondary]">
                Keep going to maintain <span className="text-[--color-accent]">Emerald!</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Redemption Card */}
      <motion.div variants={itemVariants}>
        <Card
          className={cn(
            "h-full bento-card transition-all duration-300 cursor-pointer",
            hoveredCard === "redemption" && "border-[--color-accent]/30 shadow-lg shadow-[--color-accent]/10"
          )}
          onMouseEnter={() => setHoveredCard("redemption")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-label flex items-center gap-2">
              <motion.div
                animate={{ y: hoveredCard === "redemption" ? [0, -3, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <ShoppingBag className="h-[14px] w-[14px] text-[--color-accent]" />
              </motion.div>
              Redemption
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <motion.p
              className="text-metric-hero text-[--color-text-primary]"
              animate={{ scale: hoveredCard === "redemption" ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Ready
            </motion.p>
            <div className="mt-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="w-full" size="sm" data-testid="employee-dashboard-redeem-button">
                  Browse Catalog
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token History */}
      <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8">
        <Card className="h-full glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-heading">Token History</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {tokenHistoryData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer"
                    data-testid={`employee-dashboard-activity-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="h-10 w-10 rounded-full bg-[--color-accent]/20 flex items-center justify-center"
                      >
                        <item.icon className="h-5 w-5 text-[--color-accent]" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-[--color-text-primary]">
                          {item.title}
                        </p>
                        <p className="text-xs text-[--color-text-secondary]">
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
                      <span className="text-sm font-bold text-[--color-accent]">
                        +{item.amount}
                      </span>
                      <TrendingUp className="h-3 w-3 text-[--color-accent]" />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Rewards */}
      <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4">
        <Card className="h-full glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-heading">Upcoming Rewards</CardTitle>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-[--color-text-secondary]" />
              </motion.button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRewards.map((reward, index) => (
                <motion.div
                  key={reward.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg bg-white/5 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[--color-text-primary]">
                      {reward.name}
                    </span>
                    <span className="text-xs text-[--color-text-secondary]">
                      {reward.tokensNeeded} tokens
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[--color-accent] to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${reward.progress}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-[--color-text-disabled] mt-1">
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
              className="mt-4 p-3 rounded-lg bg-[--color-accent-muted] border border-[--color-border-accent]"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-text-secondary]">Next reward in</span>
                <span className="font-semibold text-[--color-accent]">250 tokens</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
