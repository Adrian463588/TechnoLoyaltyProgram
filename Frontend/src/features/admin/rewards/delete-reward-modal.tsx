"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  rewardName: string;
  isDeleting: boolean;
}

export function DeleteRewardModal({
  isOpen,
  onClose,
  onConfirm,
  rewardName,
  isDeleting,
}: DeleteRewardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && !open && onClose()}>
      <DialogContent className="rounded-2xl bg-white border border-neutral-200 shadow-2xl p-0 overflow-hidden max-w-md">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold text-neutral-900">Delete Reward</DialogTitle>
            </div>
            <DialogDescription className="text-neutral-600 text-sm leading-relaxed">
              Are you sure you want to permanently delete <strong>{rewardName}</strong>? 
              This action cannot be undone and will remove the item from the catalog.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 flex gap-3 mt-0">
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 rounded-xl border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 active:scale-95 transition-all"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
