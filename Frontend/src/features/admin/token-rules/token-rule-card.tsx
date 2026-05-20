"use client";

/**
 * features/admin/token-rules/token-rule-card.tsx
 *
 * Client component for editing a single token conversion rule.
 * Follows the same pattern as ManualTokenAdjustment component.
 */

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Coins, Save, RotateCcw } from "lucide-react";
import { updateTokenRuleAction } from "./actions";
import type { TokenConversionRuleResponse } from "@/lib/api-client";

interface TokenRuleCardProps {
  rule: TokenConversionRuleResponse;
  index: number;
}

const DIVISION_META: Record<string, { icon: string; accent: string }> = {
  OPCENT_TELE: { icon: "🏢", accent: "--color-info" },
  TECHNO: { icon: "💻", accent: "--color-accent" },
};

export function TokenRuleCard({ rule, index }: TokenRuleCardProps) {
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState<string>(rule.tokensPerUnit.toString());
  const value = parseInt(inputValue, 10) || 1;
  const hasChanged = value !== rule.tokensPerUnit || inputValue === "";

  const meta = DIVISION_META[rule.divisionGroup] ?? {
    icon: "📦",
    accent: "--color-text-primary",
  };

  const handleSave = () => {
    if (value < 1 || !Number.isInteger(value)) {
      toast.error("Tokens per unit must be an integer ≥ 1");
      return;
    }

    startTransition(async () => {
      const result = await updateTokenRuleAction(rule.id, value);
      if (result.success) {
        setInputValue(result.rule.tokensPerUnit.toString());
        toast.success(
          `${rule.label} updated — ${result.rule.tokensPerUnit} token(s) per unit`,
        );
      } else {
        toast.error(result.error ?? "Update failed");
      }
    });
  };

  const handleReset = () => {
    setInputValue(rule.tokensPerUnit.toString());
  };

  const updatedDate = new Date(rule.updatedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      className="bento-card p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={rule.divisionGroup}>
            {meta.icon}
          </span>
          <div>
            <h3 className="text-card-heading">{rule.label}</h3>
            <p className="text-xs text-[--color-text-secondary] mt-0.5">
              Division Group: {rule.divisionGroup}
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide"
          style={{
            backgroundColor: `var(${meta.accent}-muted, var(--color-accent-muted))`,
            color: `var(${meta.accent}, var(--color-accent))`,
            border: `1px solid var(--color-border-subtle)`,
          }}
        >
          Active
        </div>
      </div>

      {/* Current Rate Display */}
      <div className="mb-6 p-4 rounded-xl bg-[--color-surface-elevated] border border-[--color-border-subtle]">
        <p className="text-label mb-2 flex items-center gap-2">
          <Coins className="h-3.5 w-3.5 text-[--color-text-secondary]" />
          Tokens Per Unit
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            step={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isPending}
            className={cn(
              "input-field text-center font-mono text-lg w-24",
              hasChanged && "border-[--color-warning]",
            )}
            data-testid={`token-rate-${rule.divisionGroup}`}
            aria-label={`Tokens per unit for ${rule.label}`}
          />
          <span className="text-sm text-[--color-text-secondary]">
            token(s) per 1 {rule.divisionGroup === "TECHNO" ? "project" : "slot"}
          </span>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-[--color-text-tertiary] mb-4">
        Last updated: {updatedDate}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: isPending || !hasChanged ? 1 : 1.02 }}
          whileTap={{ scale: isPending || !hasChanged ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={handleSave}
          disabled={isPending || !hasChanged}
          data-testid={`save-rule-${rule.divisionGroup}`}
          className={cn(
            "btn-primary flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2",
            (!hasChanged || isPending) && "opacity-50 cursor-not-allowed",
          )}
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </motion.button>

        {hasChanged && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={isPending}
            className="btn-ghost px-4 py-2.5 rounded-lg font-medium flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
