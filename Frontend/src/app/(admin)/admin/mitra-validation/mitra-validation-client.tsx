"use client";

import React, { useState } from "react";
import { UserResponse, adminApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function MitraValidationClient({ 
  users: initialUsers,
  sessionToken 
}: { 
  users: UserResponse[];
  sessionToken: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserResponse[]>(initialUsers);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string | null;
    userName: string;
    newStatus: "ACTIVE" | "RESIGNED" | null;
  }>({
    open: false,
    userId: null,
    userName: "",
    newStatus: null,
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.npk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleClick = (user: UserResponse) => {
    const nextStatus = user.partnerStatus === "ACTIVE" ? "RESIGNED" : "ACTIVE";
    setConfirmDialog({
      open: true,
      userId: user.id,
      userName: user.name,
      newStatus: nextStatus as "ACTIVE" | "RESIGNED",
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmDialog.userId || !confirmDialog.newStatus) return;

    setIsUpdating(true);
    try {
      await adminApi.updateUserStatus(sessionToken, confirmDialog.userId, confirmDialog.newStatus);
      
      setUsers(prev => prev.map(u => 
        u.id === confirmDialog.userId 
          ? { ...u, partnerStatus: confirmDialog.newStatus! } 
          : u
      ));

      toast.success(`${confirmDialog.userName} status updated to ${confirmDialog.newStatus}`, {
        style: { background: "#10b981", color: "#fff", border: "none", borderRadius: "12px" }
      });
      
      setConfirmDialog({ open: false, userId: null, userName: "", newStatus: null });
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`, {
        style: { background: "#ef4444", color: "#fff", border: "none", borderRadius: "12px" }
      });
    } finally {
      setIsUpdating(false);
    }
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
                <TableHead className="py-4 px-6 text-center font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-[var(--color-text-tertiary)]">
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
                    <TableCell className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleClick(user)}
                        disabled={isUpdating}
                        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50 mx-auto"
                        style={{ backgroundColor: user.partnerStatus === "ACTIVE" ? "#10b981" : "#d1d5db" }}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                            user.partnerStatus === "ACTIVE" ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </BentoCard>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => !isUpdating && setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-md">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  confirmDialog.newStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                )}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-neutral-900">Update Status</DialogTitle>
              </div>
              <div className="text-neutral-600 text-sm leading-relaxed">
                <p>
                  Are you sure you want to change status for <strong>{confirmDialog.userName}</strong> to <span className={cn(
                    "font-bold px-2 py-0.5 rounded-md",
                    confirmDialog.newStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  )}>{confirmDialog.newStatus}</span>?
                </p>
                
                {confirmDialog.newStatus === "RESIGNED" && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>This Mitra will be hidden from the active reward redemption list.</span>
                  </div>
                )}
              </div>
            </DialogHeader>
          </div>

          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex gap-3">
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={() => setConfirmDialog({ open: false, userId: null, userName: "", newStatus: null })}
              className="flex-1 rounded-xl border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              disabled={isUpdating}
              onClick={handleConfirmStatusChange}
              className={cn(
                "flex-1 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95",
                confirmDialog.newStatus === "ACTIVE" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"
              )}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
