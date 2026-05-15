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
          className="absolute inset-0 bg-gradient-to-br from-[--color-accent]/5 to-transparent opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-label flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Coins className="h-[14px] w-[14px] text-[--color-accent]" />
            </motion.div>
            Total Tokens
          </h3>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors relative group"
            onClick={() => setShowInfo(true)}
          >
            <Info className="h-4 w-4 text-[--color-text-secondary] group-hover:text-[--color-accent] transition-colors" />
            <motion.span
              className="absolute inset-0 rounded-full border border-[--color-accent]/30"
              initial={{ scale: 1.5, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>

        <div className="mb-6 relative z-10">
          <p className="text-metric-hero" data-testid="token-counter">
            <AnimatedTokenCount value={tokenBalance} />
          </p>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1 mt-1"
          >
            <Sparkles className="h-3 w-3 text-[--color-accent]" />
            <span className="text-xs text-[--color-accent]">
              +{Math.floor(tokenBalance * 0.02)} this month
            </span>
          </motion.div>
        </div>

        <div className="border-t border-[--color-border-subtle] pt-4 mt-auto relative z-10">
          <EligibilityChip
            eligible={eligibilityStatus.eligible}
            reason={eligibilityStatus.reason}
          />
        </div>

        {/* Tier Badge - shows on hover */}
        <motion.div
          className="absolute top-4 right-12 opacity-0 hover:opacity-100 transition-opacity"
        >
          <TierBadge tier={tier} />
        </motion.div>
      </motion.div>

      {/* Info Dialog */}
      <DialogPrimitive.Root open={showInfo} onOpenChange={setShowInfo}>
        <DialogOverlay />
        <DialogPopup>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-card p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[--color-text-primary]">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Coins className="h-5 w-5 text-[--color-accent]" />
                </motion.div>
                Token Balance Info
              </h2>
              <DialogClose>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
                >
                  <X className="h-4 w-4 text-[--color-text-secondary]" />
                </motion.div>
              </DialogClose>
            </div>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              Your tokens are earned through shifts and projects. They can be
              redeemed for rewards or may expire after 3 years.
            </p>
            <div className="space-y-3 p-4 rounded-lg bg-white/5">
              <h4 className="text-sm font-medium mb-2">Balance Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Available</span>
                  <span className="text-[--color-accent] font-semibold">
                    {tokenBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Pending</span>
                  <span className="text-[--color-text-secondary]">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Expiring (30d)</span>
                  <span className="text-[--color-warning]">0</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowInfo(false)}>
                Got it
              </Button>
            </div>
          </motion.div>
        </DialogPopup>
      </DialogPrimitive.Root>
    </>
  );
}

// Helper components for Base UI Dialog
function DialogOverlay() {
  return (
    <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
  );
}

function DialogPopup({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <div className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2">
        {children}
      </div>
    </DialogPrimitive.Portal>
  );
}

function DialogClose({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Close>{children}</DialogPrimitive.Close>;
}
