import React from "react";
import { cn } from "@/lib/utils";

// Mapping Redemption Status
export type RedemptionStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "PURCHASED"
  | "PICKUP_SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

const statusConfig: Record<RedemptionStatus, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: "rgba(148, 163, 184, 0.15)", color: "#94A3B8", label: "DRAFT" },
  PENDING_VERIFICATION: { bg: "rgba(245, 158, 11, 0.15)", color: "#FCD34D", label: "PENDING VERIFY" },
  VERIFIED: { bg: "rgba(59, 130, 246, 0.15)", color: "#93C5FD", label: "VERIFIED" },
  REJECTED: { bg: "rgba(239, 68, 68, 0.15)", color: "#FCA5A5", label: "REJECTED" },
  PURCHASED: { bg: "rgba(107, 206, 83, 0.10)", color: "#86EFAC", label: "PURCHASED" },
  PICKUP_SCHEDULED: { bg: "rgba(107, 206, 83, 0.18)", color: "#6BCE53", label: "PICKUP SCHEDULED" },
  COMPLETED: { bg: "rgba(107, 206, 83, 0.25)", color: "#6BCE53", label: "COMPLETED" },
  CANCELLED: { bg: "rgba(71, 85, 105, 0.25)", color: "#475569", label: "CANCELLED" },
};

export function RedemptionStatusChip({ status, className }: { status: RedemptionStatus; className?: string }) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-[0.06em] uppercase",
        className
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

// Mapping Tiers from PRD (SAPHIRE, EMERALD, RUBY, DIAMOND)
export type MembershipTier = "SAPHIRE" | "EMERALD" | "RUBY" | "DIAMOND";

const tierConfig: Record<MembershipTier, { bg: string; color: string; glow: string }> = {
  SAPHIRE: { bg: "rgba(148, 163, 184, 0.15)", color: "#94A3B8", glow: "rgba(148, 163, 184, 0.30)" }, // Muted blue/slate
  EMERALD: { bg: "rgba(107, 206, 83, 0.15)", color: "#6BCE53", glow: "rgba(107, 206, 83, 0.30)" }, // Green
  RUBY: { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", glow: "rgba(239, 68, 68, 0.30)" }, // Red
  DIAMOND: { bg: "rgba(103, 232, 249, 0.15)", color: "#67E8F9", glow: "rgba(103, 232, 249, 0.30)" }, // Cyan
};

export function TierBadge({ tier, className }: { tier: MembershipTier; className?: string }) {
  const config = tierConfig[tier] || tierConfig.SAPHIRE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-[0.06em] uppercase",
        className
      )}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        boxShadow: `0 0 12px ${config.glow}`,
      }}
    >
      {tier}
    </span>
  );
}

// Eligibility Chip for Redemption
export function EligibilityChip({ eligible, reason, className }: { eligible: boolean; reason?: string; className?: string }) {
  return (
    <span
      role="status"
      aria-label={eligible ? "Eligible for Redemption" : `Not eligible: ${reason}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
        eligible ? "bg-[--color-accent-muted] text-[--color-success] border border-[--color-border-accent]" : "bg-white/5 text-[--color-text-secondary] border border-[--color-border-subtle]",
        className
      )}
    >
      {eligible ? "Eligible for Redemption" : `Not eligible — ${reason}`}
    </span>
  );
}

