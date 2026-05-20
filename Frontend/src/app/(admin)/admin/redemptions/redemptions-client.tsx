"use client";

import { useState, Fragment } from "react";
import { RewardRequest, RewardRequestStatus } from "@/types";
import { adminApi } from "@/lib/api-client";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AutosaveIndicator } from "@/components/shared/autosave-indicator";
import { RedemptionPipeline, PipelineStep } from "@/components/shared/redemption-pipeline";
import { MoreHorizontal, ChevronDown, CheckSquare, Activity, Info, ExternalLink, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TO_STEP: Record<RewardRequestStatus, PipelineStep> = {
  DRAFT:           "submitted",
  PENDING_VERIFICATION: "submitted",
  VERIFIED:        "verified",
  REJECTED:        "submitted",
  PURCHASED:       "purchased",
  PICKUP_SCHEDULED:"pickup",
  COMPLETED:       "completed",
  CANCELLED:       "submitted",
};

export default function RedemptionsClient({
  initialRequests,
  sessionToken,
}: {
  initialRequests: RewardRequest[];
  sessionToken: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"All" | "PENDING_VERIFICATION">("All");
  const [selectedRequest, setSelectedRequest] = useState<RewardRequest | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reqId: string | null }>({
    open: false,
    reqId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const filtered =
    filter === "All" ? requests : requests.filter((r) => r.status === "PENDING_VERIFICATION");

  const handleStatusUpdate = async (
    id: string,
    newStatus: RewardRequestStatus,
    reason?: string
  ) => {
    setIsUpdating(true);
    try {
      await adminApi.updateRedemptionStatus(sessionToken, id, newStatus, reason);
      
      const updated = requests.map((r) =>
        r.id === id ? { ...r, status: newStatus, rejectReason: reason } : r
      );
      setRequests(updated);
      
      // Update selectedRequest if it's the one being modified
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated.find(r => r.id === id) || null);
      }

      setSavedId(id);
      setTimeout(() => setSavedId(null), 1000);
      toast.success(`Request updated to ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed — please retry");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectSubmit = () => {
    if (rejectDialog.reqId && rejectReason.trim()) {
      handleStatusUpdate(rejectDialog.reqId, "REJECTED", rejectReason);
      setRejectDialog({ open: false, reqId: null });
      setRejectReason("");
    }
  };

  const getStatusBadge = (status: RewardRequestStatus) => {
    const base = "font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm flex items-center w-fit gap-1.5";
    switch (status) {
      case "PENDING_VERIFICATION":
        return (
          <span className={cn(base, "bg-orange-500/10 text-orange-600 border-orange-200")}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Pending
          </span>
        );
      case "VERIFIED":
        return (
          <span className={cn(base, "bg-emerald-500/10 text-emerald-600 border-emerald-200")}>
            Verified
          </span>
        );
      case "REJECTED":
        return (
          <span className={cn(base, "bg-red-500/10 text-red-600 border-red-200")}>
            Rejected
          </span>
        );
      case "PURCHASED":
        return (
          <span className={cn(base, "bg-blue-500/10 text-blue-600 border-blue-200")}>
            Purchased
          </span>
        );
      case "PICKUP_SCHEDULED":
        return (
          <span className={cn(base, "bg-purple-500/10 text-purple-600 border-purple-200")}>
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className={cn(base, "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20")}>
            Completed
          </span>
        );
      default:
        return <span className={cn(base, "bg-neutral-100 text-neutral-600")}>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex flex-wrap gap-2 animate-fade-up-in" data-testid="redemption-status-filter">
        {[
          { label: "All Requests", value: "All" as const },
          { label: "Pending Verification", value: "PENDING_VERIFICATION" as const },
        ].map((item) => {
          const isActive = filter === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-300 active:scale-95 cursor-pointer",
                isActive 
                  ? "bg-[var(--color-surface-elevated)] border-[var(--color-accent)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20 shadow-sm" 
                  : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] opacity-80 hover:opacity-100 hover:shadow-sm"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <BentoCard className="p-0 overflow-hidden shadow-sm border-[var(--color-border-subtle)] animate-fade-up-in" style={{ animationDelay: "100ms" }}>
        <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Redemption Requests</span>
          </div>
          <Badge variant="outline" className="font-mono bg-[var(--color-surface-base)] text-[var(--color-text-secondary)]">
            {filtered.length} Requests
          </Badge>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <Table data-testid="redemptions-table" className="min-w-[900px]">
            <TableHeader className="bg-[var(--color-surface-elevated)]/50">
              <TableRow className="border-[var(--color-border-subtle)] hover:bg-transparent">
                <TableHead className="w-[120px] py-4 px-6 font-semibold text-[var(--color-text-secondary)]">ID</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Employee</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Reward</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)] text-right">Cost</TableHead>
                <TableHead className="py-4 px-6 font-semibold text-[var(--color-text-secondary)]">Status</TableHead>
                <TableHead className="w-[100px] py-4 px-6 text-right font-semibold text-[var(--color-text-secondary)]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-[var(--color-text-tertiary)]">
                    No requests match your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow
                    key={req.id}
                    className="group border-b border-[var(--color-border-subtle)] transition-all duration-200 hover:bg-[var(--color-accent)]/[0.05] cursor-default"
                  >
                    <TableCell className="py-4 px-6 text-xs text-[var(--color-text-tertiary)] font-mono">
                      #{req.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      {req.userName}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-[var(--color-text-secondary)]">
                      {req.rewardName}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {req.tokensSpent.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        {savedId === req.id && <AutosaveIndicator show label="Updated" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="p-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-xl transition-all border border-transparent hover:border-[var(--color-accent)]/20 active:scale-95"
                        title="Track & Manage"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </BentoCard>

      {/* Tracker & Management Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Track Redemption</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  ID: #{selectedRequest.id.slice(0, 12)} • {selectedRequest.userName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto">
              <div className="space-y-10">
                {/* Reward Info Summary */}
                <div className="grid grid-cols-2 gap-4 p-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Requested Reward</p>
                    <p className="text-sm font-semibold text-neutral-900">{selectedRequest.rewardName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Token Cost</p>
                    <p className="text-sm font-mono font-bold text-[var(--color-accent)]">{selectedRequest.tokensSpent.toLocaleString()} tokens</p>
                  </div>
                </div>

                {/* Pipeline */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
                      Processing Timeline
                    </p>
                  </div>
                  <div className="px-2">
                    <RedemptionPipeline
                      currentStep={STATUS_TO_STEP[selectedRequest.status]}
                      compact={false}
                    />
                  </div>
                </div>

                {/* Rejection Info */}
                {selectedRequest.rejectReason && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start">
                    <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900 uppercase tracking-tight mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700 leading-relaxed">
                        {selectedRequest.rejectReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="pt-6 border-t border-neutral-100">
                   <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 text-center">Available Actions</p>
                   <div className="flex flex-wrap justify-center gap-3">
                      {selectedRequest.status === "PENDING_VERIFICATION" && (
                        <>
                          <Button
                            onClick={() => handleStatusUpdate(selectedRequest.id, "VERIFIED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Verified"}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setRejectDialog({ open: true, reqId: selectedRequest.id })}
                            className="rounded-xl px-6"
                            disabled={isUpdating}
                          >
                            Reject Request
                          </Button>
                        </>
                      )}
                      
                      {selectedRequest.status === "VERIFIED" && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedRequest.id, "PURCHASED")}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Purchase"}
                        </Button>
                      )}

                      {selectedRequest.status === "PURCHASED" && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedRequest.id, "PICKUP_SCHEDULED")}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Pickup"}
                        </Button>
                      )}

                      {selectedRequest.status === "PICKUP_SCHEDULED" && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedRequest.id, "COMPLETED")}
                          className="bg-[var(--color-accent)] hover:opacity-90 text-white rounded-xl px-6"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Completed"}
                        </Button>
                      )}

                      {["COMPLETED", "REJECTED", "CANCELLED"].includes(selectedRequest.status) && (
                        <p className="text-sm text-neutral-400 italic">No further actions available for this request status.</p>
                      )}
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this redemption request. This will be visible
              to the employee.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Ineligible due to recent performance downgrade."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[120px] rounded-xl bg-neutral-50 border-neutral-200"
            data-testid="reject-reason-input"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, reqId: null })}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || isUpdating}
              className="rounded-xl"
              data-testid="confirm-reject-btn"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
