"use client";

import { useState, useMemo } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmployeeStatusBadge,
  type MembershipTier,
  type PartnerStatus,
} from "@/components/shared/status-badge";
import { AlertTriangle, Coins, Search, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Division } from "@/types";
import type { TeamSummaryResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";

type TeamMember = {
  id: string;
  name: string;
  npk: string;
  division: Division;
  tokens: number;
  tier: MembershipTier;
  status: PartnerStatus;
};

function toMembershipTier(value: string): MembershipTier {
  const normalized = value?.toUpperCase() || "";
  if (
    normalized === "SAPHIRE" ||
    normalized === "EMERALD" ||
    normalized === "RUBY" ||
    normalized === "DIAMOND"
  ) {
    return normalized;
  }
  return "SAPHIRE";
}

function toPartnerStatus(value: string): PartnerStatus {
  const normalized = value?.toUpperCase() || "";
  if (
    normalized === "ACTIVE" ||
    normalized === "DOWNGRADED" ||
    normalized === "RESET" ||
    normalized === "INACTIVE"
  ) {
    return normalized;
  }
  return "INACTIVE";
}

export function LeaderTeamClient({ 
  data,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
}: { 
  data: TeamSummaryResult;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PartnerStatus>("All");

  const teamData: TeamMember[] = useMemo(() => {
    return data.members.map(m => ({
      id: m.id,
      name: m.name,
      npk: m.npk,
      division: m.division === "TECHNO" ? "Techno" : "Optel",
      tokens: m.currentBalance,
      tier: toMembershipTier(m.membershipTier),
      status: toPartnerStatus(m.partnerStatus),
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    return teamData.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.npk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teamData, searchQuery, statusFilter]);

  const totalTokens = teamData.reduce((acc, curr) => acc + curr.tokens, 0);
  const membersWithBalance = teamData.filter((m) => m.tokens > 0).length;
  const alertsCount = teamData.filter((m) => m.status !== "ACTIVE").length;

  const getTierStyles = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case "SAPHIRE": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "EMERALD": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "RUBY": return "bg-red-500/10 text-red-600 border-red-200";
      case "DIAMOND": return "bg-purple-500/10 text-purple-600 border-purple-200";
      default: return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header Card */}
      <div className="bento-card p-8 flex flex-col md:flex-row md:items-center justify-between animate-fade-up-in">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm shadow-primary/5 shrink-0"> 
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[--color-text-secondary] leading-none">Team Overview</h1>
            <p className="text-sm text-[--color-text-secondary]">
              Monitor your team&apos;s loyalty performance, tiers, and status updates.
            </p>
          </div>
        </div>
      </div>

      {/* Team Summary Cards - Admin Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-4 flex flex-col justify-between bg-white border-[var(--color-border-subtle)] shadow-sm animate-fade-up-in stagger-1">
          <h3 className="text-label flex items-center gap-2 mb-4">
            <Coins className="h-[14px] w-[14px] text-primary" />
            Team Aggregate Tokens
          </h3>
          <div>
            <p className="text-3xl font-black text-slate-700 leading-none">{totalTokens.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Combined team balance</p>
          </div>
        </BentoCard>

        <BentoCard className="p-4 flex flex-col justify-between bg-white border-[var(--color-border-subtle)] shadow-sm animate-fade-up-in stagger-2">
          <h3 className="text-label flex items-center gap-2 mb-4">
            <Users className="h-[14px] w-[14px] text-emerald-500" />
            Members with Tokens
          </h3>
          <div>
            <p className="text-3xl font-black text-slate-700 leading-none">{membersWithBalance} Members</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Positive authoritative ledger balance</p>
          </div>
        </BentoCard>

        <BentoCard className="p-4 flex flex-col justify-between bg-white border-[var(--color-border-subtle)] shadow-sm animate-fade-up-in stagger-3">
          <h3 className="text-label flex items-center gap-2 mb-4">
            <AlertTriangle className="h-[14px] w-[14px] text-amber-500" />
            Team Alerts
          </h3>
          <div>
            <p className="text-3xl font-black text-slate-700 leading-none">{alertsCount} Members</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Action required or inactive</p>
          </div>
        </BentoCard>
      </div>

      {/* Members Data Grid - Admin Style */}
      <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)] h-[500px] min-h-[500px] flex flex-col animate-fade-up-in stagger-4">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search team member by name or NPK..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 p-1 bg-slate-100/50 rounded-lg border border-slate-200/50">
               {(["All", "ACTIVE", "RESET"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status === "All" ? "All" : status)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                      statusFilter === status 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status}
                  </button>
               ))}
             </div>
             <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
               {filteredData.length} Members
             </Badge>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-[var(--color-surface-elevated)]/50">
              <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Employee</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">NPK</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Division</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Membership Tier</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Tokens</TableHead>
                <TableHead className="w-[120px] py-4 px-6 text-center font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-[var(--color-text-tertiary)]">
                    No team members found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                  >
                    <TableCell className="py-4 px-6">
                      <p className="text-[var(--color-text-secondary)] transition-colors">
                        {member.name}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <p className="text-[var(--color-text-secondary)] uppercase tracking-tighter">
                        {member.npk}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        member.division === "Optel"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-indigo-50 text-indigo-600 border-indigo-100"
                      )}>
                        {member.division}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm",
                          getTierStyles(member.tier)
                        )}
                      >
                        {member.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <EmployeeStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right text-foreground">
                      {member.tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <Link
                        href={`/leader/team/${member.id}`}
                        className="inline-flex items-center justify-center h-9 w-9 text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20 active:scale-95 mx-auto"
                        title="View Detail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalCount || teamData.length}
        />
      </BentoCard>
    </div>
  );
}
