"use client";

import React, { useState } from "react";
import { UserResponse } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Search } from "lucide-react";
import AdjustmentModal from "./adjustment-modal";

export default function AdjustmentsClient({ users }: { users: UserResponse[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.npk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BentoCard className="overflow-hidden p-0">
      <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by Name or NPK..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="text-xs bg-[var(--color-surface-base)] border-[var(--color-border-subtle)]">
          {filteredUsers.length} Mitras
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[var(--color-surface-elevated)]/50">
            <TableRow className="border-[var(--color-border-subtle)]">
              <TableHead className="font-semibold text-[var(--color-text-secondary)]">NPK</TableHead>
              <TableHead className="font-semibold text-[var(--color-text-secondary)]">Name</TableHead>
              <TableHead className="font-semibold text-[var(--color-text-secondary)]">Division</TableHead>
              <TableHead className="font-semibold text-[var(--color-text-secondary)]">Tier</TableHead>
              <TableHead className="font-semibold text-[var(--color-text-secondary)] text-right">Tokens</TableHead>
              <TableHead className="text-right font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[var(--color-text-tertiary)]">
                  No mitras found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] transition-colors">
                  <TableCell className="font-mono text-sm text-[var(--color-text-secondary)]">{user.npk}</TableCell>
                  <TableCell className="font-medium text-[var(--color-text-primary)]">{user.name}</TableCell>
                  <TableCell className="text-[var(--color-text-secondary)]">{user.division}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20 font-medium tracking-wide">
                      {user.membershipTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold text-[var(--color-accent)]">
                      {(user.tokens ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-all border border-transparent hover:border-[var(--color-accent)]/20 inline-flex items-center justify-center"
                      title="Adjust Tokens"
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

      {selectedUser && (
        <AdjustmentModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </BentoCard>
  );
}