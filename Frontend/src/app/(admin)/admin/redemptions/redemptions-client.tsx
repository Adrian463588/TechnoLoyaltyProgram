"use client";

import { useState, Fragment } from "react";
import { RewardRequest, RewardRequestStatus } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
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
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TO_STEP: Record<RewardRequestStatus, PipelineStep> = {
  Pending:         "submitted",
  Verified:        "verified",
  Rejected:        "submitted",
  Purchased:       "purchased",
  PickupScheduled: "pickup",
  Completed:       "completed",
  Cancelled:       "submitted",
};

export default function RedemptionsClient({
  initialRequests,
}: {
  initialRequests: RewardRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"All" | "Pending">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; reqId: string | null }>({
    open: false,
    reqId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const filtered =
    filter === "All" ? requests : requests.filter((r) => r.status === "Pending");

  const handleStatusUpdate = (
    id: string,
    newStatus: RewardRequestStatus,
    reason?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, rejectReason: reason } : r
      )
    );
    // Trigger autosave indicator
    setSavedId(id);
    setTimeout(() => setSavedId(null), 100);
    toast.success(`Request ${id} updated to ${newStatus}`);
  };

  const handleRejectSubmit = () => {
    if (rejectDialog.reqId && rejectReason.trim()) {
      handleStatusUpdate(rejectDialog.reqId, "Rejected", rejectReason);
      setRejectDialog({ open: false, reqId: null });
      setRejectReason("");
    }
  };

  const getStatusBadge = (status: RewardRequestStatus) => {
    const base = "text-xs font-medium px-2.5 py-1 rounded-full border";
    switch (status) {
      case "Pending":
        return (
          <span className={cn(base, "bg-secondary/10 text-secondary border-secondary/20")}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary mr-1.5 animate-dot-pulse" />
            Pending
          </span>
        );
      case "Verified":
        return (
          <span className={cn(base, "bg-primary/10 text-primary border-primary/20")}>
            Verified
          </span>
        );
      case "Rejected":
        return (
          <span className={cn(base, "bg-destructive/10 text-destructive border-destructive/20")}>
            Rejected
          </span>
        );
      case "Purchased":
        return (
          <span className={cn(base, "bg-secondary/10 text-secondary border-secondary/20")}>
            Purchased
          </span>
        );
      case "PickupScheduled":
        return (
          <span className={cn(base, "bg-blue-500/10 text-blue-400 border-blue-400/20")}>
            Scheduled
          </span>
        );
      case "Completed":
        return (
          <span className={cn(base, "bg-primary/20 text-primary border-primary/30")}>
            Completed
          </span>
        );
      default:
        return <span className={cn(base, "bg-muted text-muted-foreground")}>{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2" data-testid="redemption-status-filter">
        <Button
          variant={filter === "All" ? "default" : "outline"}
          onClick={() => setFilter("All")}
          size="sm"
        >
          All Requests
        </Button>
        <Button
          variant={filter === "Pending" ? "default" : "outline"}
          onClick={() => setFilter("Pending")}
          size="sm"
        >
          Pending Verification
        </Button>
      </div>

      <BentoCard className="p-0 overflow-hidden" glow={false}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <Fragment key={req.id}>
                  <TableRow
                    className="hover:bg-muted/20 transition-colors duration-150 cursor-pointer border-border"
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {req.id}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{req.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{req.rewardName}</TableCell>
                    <TableCell className="font-semibold text-foreground tabular-nums">
                      {req.tokensSpent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        {savedId === req.id && <AutosaveIndicator show label="Updated" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`manage-btn-${req.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            {req.status === "Pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(req.id, "Verified");
                                  }}
                                  className="text-primary focus:text-primary"
                                >
                                  Mark Verified
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectDialog({ open: true, reqId: req.id });
                                  }}
                                >
                                  Reject Request
                                </DropdownMenuItem>
                              </>
                            )}
                            {req.status === "Verified" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(req.id, "Purchased");
                                }}
                              >
                                Mark Purchased
                              </DropdownMenuItem>
                            )}
                            {req.status === "Purchased" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(req.id, "PickupScheduled");
                                }}
                              >
                                Schedule Pickup
                              </DropdownMenuItem>
                            )}
                            {req.status === "PickupScheduled" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(req.id, "Completed");
                                }}
                              >
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            expandedId === req.id && "rotate-180"
                          )}
                        />
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded pipeline row */}
                  {expandedId === req.id && (
                    <TableRow
                      key={`${req.id}-pipeline`}
                      className="bg-muted/10 border-t-0 border-border"
                    >
                      <TableCell colSpan={6} className="py-4 px-6 animate-fade-up-in">
                        <div className="max-w-md">
                          <p className="text-xs text-muted-foreground mb-3 font-medium">
                            Redemption Progress
                          </p>
                          <RedemptionPipeline
                            currentStep={STATUS_TO_STEP[req.status]}
                            compact={false}
                          />
                          {req.rejectReason && (
                            <p className="mt-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                              Rejection reason: {req.rejectReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </BentoCard>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
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
            className="min-h-[100px]"
            data-testid="reject-reason-input"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, reqId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
              data-testid="confirm-reject-btn"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
