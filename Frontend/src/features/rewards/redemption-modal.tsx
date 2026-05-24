"use client";

import React, { useTransition, useEffect, useRef } from "react";
import { RewardItem } from "./reward-catalog";
import { Coins, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { employeeApi } from "@/lib/api-client";

interface RedemptionModalProps {
  reward: RewardItem;
  userTokens: number;
  onClose: () => void;
}

export function RedemptionModal({ reward, userTokens, onClose }: RedemptionModalProps) {
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const balanceAfter = userTokens - reward.tokenCost;

  // Focus trap: capture first/last focusable inside modal
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock scroll + handle Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
        return;
      }
      // Tab focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    // Auto-focus modal on mount
    setTimeout(() => modalRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isPending, onClose]);

  const handleConfirm = () => {
    if (!session?.user) {
      toast.error("Session expired — please refresh.");
      return;
    }
    startTransition(async () => {
      try {
        // Build internal server token from session (same pattern as api-client)
        const tokenRes = await fetch("/api/auth/session");
        const sess = await tokenRes.json() as { internalToken?: string };
        // Fall back: use session-derived token if available, else empty (backend will 401)
        const token = sess.internalToken ?? "";
        await employeeApi.createRedemption(token, reward.id);
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-[--color-success]" size={16} aria-hidden="true" />
            <span>Redemption requested successfully!</span>
          </div>
        );
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Redemption failed — please retry.");
      }
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="presentation"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isPending && onClose()}
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative w-full max-w-md bg-card shadow-xl rounded-xl p-6 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="redeem-modal-title"
          aria-describedby="redeem-modal-desc"
          tabIndex={-1}
        >
          <div className="flex justify-between items-center mb-6">
            <h2
              id="redeem-modal-title"
              className="text-xl font-display font-semibold text-[--color-text-primary]"
            >
              Confirm Redemption
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={onClose}
              disabled={isPending}
              aria-label="Close dialog"
              className="p-1 rounded-md text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-white/10 transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </motion.button>
          </div>

          <div id="redeem-modal-desc" className="space-y-4 mb-8">
            <div className="p-4 bg-black/20 rounded-xl">
              <h3 className="font-semibold text-[--color-text-primary]">{reward.name}</h3>
              <p className="text-sm text-[--color-text-secondary] mt-1">{reward.description}</p>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-[--color-text-secondary]">
                <dt>Current Balance:</dt>
                <dd className="font-mono">{userTokens.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between text-[--color-error]">
                <dt>Cost:</dt>
                <dd className="font-mono">-{reward.tokenCost.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between text-[--color-text-primary] font-medium pt-2 border-t border-[--color-border-subtle]">
                <dt>Balance After:</dt>
                <dd className="font-mono text-[--color-accent] flex items-center gap-1">
                  <Coins size={14} aria-hidden="true" /> {balanceAfter.toLocaleString()}
                </dd>
              </div>
            </dl>
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
              disabled={isPending || balanceAfter < 0}
              className="btn-primary flex-1 flex justify-center items-center text-sm"
              data-testid="confirm-redemption-btn"
            >
              {isPending ? (
                <span
                  className="animate-pulse-ring h-4 w-4 rounded-full border-2 border-[#0F172A] border-t-transparent"
                  aria-label="Processing..."
                  role="status"
                />
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
