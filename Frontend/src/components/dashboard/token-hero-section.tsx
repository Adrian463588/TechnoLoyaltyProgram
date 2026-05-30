"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { TierBadge, MembershipTier, EligibilityChip } from "@/components/shared/status-badge";
import { TokenCardSkeleton } from "@/components/shared/skeleton-card";
import { AnimatedTokenCount } from "./animated-token-count";
import { Coins, Info, Sparkles, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface TokenHeroSectionProps {
  tokenBalance: number;
  tier: MembershipTier;
  eligibilityStatus: { eligible: boolean; reason?: string };
  isLoading?: boolean;
}

export function TokenHeroSection({
  tokenBalance,
  tier,
  eligibilityStatus,
  isLoading,
}: TokenHeroSectionProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (isLoading) {
    return <TokenCardSkeleton />;
  }

  // Tier-based accent colors for text
  const tierAccents = {
    SAPHIRE: { text: "text-blue-600" },
    EMERALD: { text: "text-emerald-600" },
    RUBY:    { text: "text-red-600" },
    DIAMOND: { text: "text-purple-600" },
  }[tier.toUpperCase()] || { text: "text-slate-600" };

  const canRedeem = userRole === "MITRA" || userRole === "HC_PM";
  const isLeader = userRole === "TEAM_LEADER";

  return (
    <>
      <div className="bento-card flex flex-col p-6 w-full h-full bg-gradient-to-br from-[--color-surface-elevated] to-[--color-surface-base] relative overflow-hidden group min-h-[220px]">
        {/* Decorative Background Icon - Maximized */}
        <div className="absolute -bottom-10 -right-10 opacity-[0.04] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-1000 pointer-events-none">
          <Coins size={240} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div>
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase mb-4 opacity-60 text-[--color-text-secondary]">
              {isLeader ? "Team Aggregate Balance" : "Your Total Balance"}
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center mb-6">
            <div className="flex items-baseline gap-2">
              <div className="text-7xl font-black text-[--color-accent] font-display tracking-tighter leading-none" data-testid="token-counter">
                <AnimatedTokenCount value={tokenBalance} />
              </div>
            </div>
          </div>

          {/* CTA Link - No divider */}
          {canRedeem && (
            <div className="mt-auto pt-4">
              <Link 
                href="/employee/rewards" 
                className="group/link inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
              >
                Redeem Reward Now
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="h-3 w-3" />
                </motion.span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Info Dialog */}
      <DialogPrimitive.Root open={showInfo} onOpenChange={setShowInfo}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 bg-black/50 z-50 transition-opacity" />
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white border border-border rounded-xl shadow-lg p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Coins className="h-5 w-5 text-primary" />
                </motion.div>
                Token Balance Info
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                onClick={() => setShowInfo(false)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your tokens are earned through shifts and projects. They can be
              redeemed for rewards or may expire after 3 years.
            </p>
            <div className="space-y-3 p-4 rounded-lg bg-slate-50">
              <h4 className="text-sm font-bold mb-2 text-foreground">Balance Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Available</span>
                  <span className="text-primary font-bold">
                    {tokenBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Pending</span>
                  <span className="text-muted-foreground font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Expiring (30d)</span>
                  <span className="text-warning font-bold">0</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="secondary" onClick={() => setShowInfo(false)}>
                Got it
              </Button>
            </div>
          </motion.div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
