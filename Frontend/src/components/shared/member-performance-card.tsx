"use client";

import React from "react";
import { Coins, Shield, TrendingUp, User, ArrowUpRight } from "lucide-react";
import { TierBadge, EmployeeStatusBadge, type MembershipTier, type PartnerStatus } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

interface MemberPerformanceCardProps {
  member: {
    id: string;
    name: string;
    npk: string;
    division: string;
    tokens: number;
    tier: MembershipTier;
    status: PartnerStatus;
    trend?: number[]; // Mock data for sparkline
  };
  onClick?: () => void;
}

export function MemberPerformanceCard({ member, onClick }: MemberPerformanceCardProps) {
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5"
      )}
    >
      {/* Top Row: Name & Tokens */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-extrabold text-slate-600 tracking-tight">
          {member.name}
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100/50">
          <Coins size={16} className="text-amber-500" />
          <span className="text-lg font-black text-amber-700 font-display leading-none">
            {member.tokens.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="h-px w-full bg-slate-100 mb-4" />

      {/* Bottom Row: Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* NPK Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">NPK</span>
          <span className="text-xs font-bold text-slate-600">{member.npk}</span>
        </div>

        {/* Division Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
          <Shield size={12} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{member.division}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <TierBadge tier={member.tier} />
          <EmployeeStatusBadge status={member.status} />
        </div>
      </div>
    </div>
  );
}
