"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RedemptionStatusChip, RedemptionStatus } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";

type RedemptionRequest = {
  id: string;
  mitraName: string;
  division: string;
  rewardName: string;
  tokenCost: number;
  status: RedemptionStatus;
  submittedAt: string;
  userNpk: string;
};

interface TeamRedemptionsTableProps {
  requests: RedemptionRequest[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function TeamRedemptionsTable({ 
  requests,
  currentPage,
  totalPages,
  totalCount
}: TeamRedemptionsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RedemptionStatus>("All");

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.mitraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userNpk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.rewardName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filterOptions: ("All" | RedemptionStatus)[] = [
    "All",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "PURCHASED",
    "REJECTED",
  ];

  return (
    <div className="space-y-4">
      <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)]">
        <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                placeholder="Search member, NPK, or reward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '3.5rem' }}
                className="pr-10 h-10 text-xs bg-white/50 border-slate-200/60 focus:bg-white transition-all rounded-xl focus:ring-0 focus:border-primary/50 block w-full"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50 overflow-x-auto no-scrollbar">
              {filterOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                    statusFilter === status 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 shrink-0">
              {totalCount} Results
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-[var(--color-surface-elevated)]/50">
              <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Member</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">NPK</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reward</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Cost</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Date</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-[var(--color-text-tertiary)]">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-10" />
                      <p className="text-sm font-medium">No results found for your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05]"
                  >
                    <TableCell className="py-4 px-6">
                      <p className="text-sm font-normal text-[var(--color-text-secondary)] leading-none">{req.mitraName}</p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <p className="text-sm text-slate-500 font-normal">{req.userNpk}</p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <p className="text-sm font-normal text-[var(--color-text-secondary)]">{req.rewardName}</p>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="text-sm font-normal text-slate-700">
                        {req.tokenCost.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm font-normal text-slate-500">
                        {formatDate(req.submittedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <RedemptionStatusChip status={req.status} className="scale-90 origin-left" />
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
          totalResults={totalCount}
        />
      </BentoCard>
    </div>
  );
}
