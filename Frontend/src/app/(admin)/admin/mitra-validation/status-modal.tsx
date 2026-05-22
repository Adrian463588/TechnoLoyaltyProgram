"use client";

import React, { useState, useTransition } from "react";
import { UserResponse, adminApi } from "@/lib/api-client";
import { toast } from "sonner";
import { X, Loader2, AlertCircle, CheckCircle2, UserMinus, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StatusModalProps {
  user: UserResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, status: "ACTIVE" | "INACTIVE" | "RESIGNED") => void;
  sessionToken: string;
}

export default function StatusModal({ user, isOpen, onClose, onSuccess, sessionToken }: StatusModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "INACTIVE" | "RESIGNED">(user.partnerStatus);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (selectedStatus === user.partnerStatus) {
      onClose();
      return;
    }
    setShowConfirm(true);
  };

  const confirmUpdate = () => {
    startTransition(async () => {
      try {
        await adminApi.updateUserStatus(sessionToken, user.id, selectedStatus);
        toast.success(`${user.name} status updated to ${selectedStatus}`);
        onSuccess(user.id, selectedStatus);
        onClose();
      } catch (err: any) {
        toast.error(`Failed to update status: ${err.message}`);
      } finally {
        setShowConfirm(false);
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "INACTIVE": return <UserMinus className="w-4 h-4 text-orange-500" />;
      case "RESIGNED": return <UserX className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Update Status</h2>
              <p className="text-sm text-neutral-500 mt-1">{user.name} ({user.npk})</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select New Status
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(["ACTIVE", "INACTIVE", "RESIGNED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                      selectedStatus === status
                        ? "bg-[var(--color-accent)]/5 border-[var(--color-accent)] text-[var(--color-accent)] font-semibold shadow-sm"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status.toLowerCase()}</span>
                    </div>
                    {selectedStatus === status && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 bg-neutral-50 rounded-b-2xl">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-neutral-300 text-neutral-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={selectedStatus === user.partnerStatus}
              className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 px-6 font-semibold"
            >
              Update Status
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-sm">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold text-neutral-900">Confirm Change</DialogTitle>
              </div>
              <DialogDescription className="text-neutral-600 text-sm leading-relaxed">
                Are you sure you want to change status to <span className="font-bold text-neutral-900 capitalize">{selectedStatus.toLowerCase()}</span>?
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex gap-3">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded-xl border-neutral-300 text-neutral-600"
            >
              Back
            </Button>
            <Button
              disabled={isPending}
              onClick={confirmUpdate}
              className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-md active:scale-95"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
