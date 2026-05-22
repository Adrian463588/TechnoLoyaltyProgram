"use client";

import React, { useState } from "react";
import { UserResponse } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusModal from "./status-modal";
import { EmployeeStatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";

export default function MitraValidationClient({ 
  users: initialUsers,
  sessionToken,
  totalCount,
  currentPage,
  totalPages,
}: { 
  users: UserResponse[];
  sessionToken: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserResponse[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.npk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdateSuccess = (userId: string, newStatus: "ACTIVE" | "INACTIVE" | "RESIGNED") => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, partnerStatus: newStatus } 
        : u
    ));
  };

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
    <div className="space-y-6">
      <BentoCard className="overflow-hidden p-0 shadow-sm border-[var(--color-border-subtle)]">
        <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search mitra by name or NPK..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
            {filteredUsers.length} Mitras
          </Badge>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-[var(--color-surface-elevated)]/50">
              <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">NPK</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Mitra Name</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Division</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Membership Tier</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
                <TableHead className="py-4 px-6 text-center font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-[var(--color-text-tertiary)]">
                    No mitras found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                  >
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)]">
                      {user.npk}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)]">
                      <span className="group-hover:text-[var(--color-text-primary)] transition-colors">
                        {user.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)]">
                      {user.division}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm",
                          getTierStyles(user.membershipTier)
                        )}
                      >
                        {user.membershipTier}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <EmployeeStatusBadge status={user.partnerStatus} />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-xl transition-all border border-transparent hover:border-[var(--color-accent)]/20 active:scale-95"
                        title="Update Status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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

      {selectedUser && (
        <StatusModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleStatusUpdateSuccess}
          sessionToken={sessionToken}
        />
      )}
    </div>
  );
}
