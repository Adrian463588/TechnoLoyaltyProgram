import React from "react";
import { cn } from "@/lib/utils";

// Mapping Redemption Status
export type RedemptionStatus =
  | "REQUESTED"
  | "REVIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

const statusConfig: Record<RedemptionStatus, { bg: string; color: string; label: string }> = {
  REQUESTED: { bg: "#FEF3C7", color: "#D97706", label: "REQUESTED" },
  REVIEWED:  { bg: "#DBEAFE", color: "#2563EB", label: "REVIEWED" },
  ACCEPTED:  { bg: "#DCFCE7", color: "#16A34A", label: "ACCEPTED" },
  REJECTED:  { bg: "#FEE2E2", color: "#DC2626", label: "REJECTED" },
  CANCELLED: { bg: "#F1F5F9", color: "#475569", label: "CANCELLED" },
};

export function RedemptionStatusChip({ status, className }: { status: RedemptionStatus; className?: string }) {
  const config = statusConfig[status] || statusConfig.REQUESTED;
  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold tracking-[0.06em] uppercase border border-transparent shadow-sm",
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

const tierConfig: Record<MembershipTier, { bg: string; color: string; border: string }> = {
  SAPHIRE: { bg: "bg-blue-100", color: "text-blue-700", border: "border-blue-300" },
  EMERALD: { bg: "bg-emerald-100", color: "text-emerald-700", border: "border-emerald-300" },
  RUBY:    { bg: "bg-red-100", color: "text-red-700", border: "border-red-300" },
  DIAMOND: { bg: "bg-purple-100", color: "text-purple-700", border: "border-purple-300" },
};

export function TierBadge({ tier, className }: { tier: MembershipTier; className?: string }) {
  const config = tierConfig[tier] || tierConfig.SAPHIRE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold tracking-wider uppercase border",
        config.bg,
        config.color,
        config.border,
        className
      )}
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

// Partner/Employee Status Badge
export type PartnerStatus = "ACTIVE" | "DOWNGRADED" | "RESET" | "INACTIVE" | "RESIGNED";

const partnerStatusConfig: Record<PartnerStatus, { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "#DCFCE7", color: "#16A34A", label: "ACTIVE" },
  DOWNGRADED: { bg: "#FEF3C7", color: "#D97706", label: "DOWNGRADED" },
  RESET: { bg: "#FEE2E2", color: "#DC2626", label: "RESET" },
  INACTIVE: { bg: "#F1F5F9", color: "#64748B", label: "INACTIVE" },
  RESIGNED: { bg: "#FEE2E2", color: "#EF4444", label: "RESIGNED" },
};

export function EmployeeStatusBadge({ status, className }: { status: PartnerStatus | string; className?: string }) {
  const normalizedStatus = (status?.toUpperCase() || "ACTIVE") as PartnerStatus;
  const config = partnerStatusConfig[normalizedStatus] || partnerStatusConfig.ACTIVE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase border border-transparent shadow-sm",
        className
      )}
      style={{ 
        backgroundColor: config.bg, 
        color: config.color
      }}
    >
      {config.label}
    </span>
  );
}
