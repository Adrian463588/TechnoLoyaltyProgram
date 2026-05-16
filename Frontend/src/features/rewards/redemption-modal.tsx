"use client";

import React, { useTransition } from "react";
import { RewardItem } from "./reward-catalog";
import { Coins, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface RedemptionModalProps {
  reward: RewardItem;
  userTokens: number;
  onClose: () => void;
}

export function RedemptionModal({ reward, userTokens, onClose }: RedemptionModalProps) {
  const [isPending, startTransition] = useTransition();
  const balanceAfter = userTokens - reward.tokenCost;

  const handleConfirm = () => {
    startTransition(async () => {
      // Simulate API submission
      await new Promise(res => setTimeout(res, 800));
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-[--color-success]" size={16} />
          <span>Redemption requested successfully!</span>
        </div>
      );
      onClose();
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isPending && onClose()}
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative w-full max-w-md bg-white shadow-xl border border-border rounded-xl p-6 overflow-hidden border border-[--color-border-glass]"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-[--color-text-primary]">Confirm Redemption</h2>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={onClose} 
              disabled={isPending}
              className="p-1 rounded-md text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-black/20 rounded-xl border border-[--color-border-subtle]">
              <h3 className="font-semibold text-[--color-text-primary]">{reward.name}</h3>
              <p className="text-sm text-[--color-text-secondary] mt-1">{reward.description}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[--color-text-secondary]">
                <span>Current Balance:</span>
                <span className="font-mono">{userTokens}</span>
              </div>
              <div className="flex justify-between text-[--color-error]">
                <span>Cost:</span>
                <span className="font-mono">-{reward.tokenCost}</span>
              </div>
              <div className="flex justify-between text-[--color-text-primary] font-medium pt-2 border-t border-[--color-border-subtle]">
                <span>Balance After:</span>
                <span className="font-mono text-[--color-accent] flex items-center gap-1">
                  <Coins size={14} /> {balanceAfter}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={onClose}
              disabled={isPending}
              className="btn-ghost flex-1 text-sm font-medium"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={handleConfirm}
              disabled={isPending}
              className="btn-primary flex-1 flex justify-center items-center text-sm"
            >
              {isPending ? (
                <span className="animate-pulse-ring h-4 w-4 rounded-full border-2 border-[#0F172A] border-t-transparent" />
              ) : (
                "Confirm Redemption"
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
