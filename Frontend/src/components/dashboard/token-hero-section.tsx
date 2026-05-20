"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { TierBadge, MembershipTier, EligibilityChip } from "@/components/shared/status-badge";
import { TokenCardSkeleton } from "@/components/shared/skeleton-card";
import { AnimatedTokenCount } from "./animated-token-count";
import { Coins, Info, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  if (isLoading) {
    return <TokenCardSkeleton />;
  }

  return (
    <>
      <motion.div
        className="bento-card flex flex-col justify-between p-6 w-full h-full relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-label flex items-center gap-2 text-primary">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Coins className="h-[14px] w-[14px]" />
            </motion.div>
            Total Tokens
          </h3>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier} />
            <motion.button
              whileHover="hover"
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors relative group"
              onClick={() => setShowInfo(true)}
            >
              <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <motion.span
                className="absolute inset-0 rounded-full border border-primary/30"
                variants={{
                  initial: { scale: 1.5, opacity: 0 },
                  hover: { scale: 1, opacity: 1, transition: { duration: 0.3 } }
                }}
                initial="initial"
              />
            </motion.button>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <p className="text-metric" data-testid="token-counter">
            <AnimatedTokenCount value={tokenBalance} />
          </p>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1 mt-1"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-bold">
              +{Math.floor(tokenBalance * 0.02)} this month
            </span>
          </motion.div>
        </div>

        <div className="border-t border-border pt-4 mt-auto relative z-10">
          <EligibilityChip
            eligible={eligibilityStatus.eligible}
            reason={eligibilityStatus.reason}
          />
        </div>
      </motion.div>

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
