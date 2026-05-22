"use client";

import React, { useTransition } from "react";
import { UserResponse } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { submitManualAdjustment } from "@/features/admin/actions";
import { cn } from "@/lib/utils";

const adjustmentSchema = z.object({
  actionType: z.enum(["add", "deduct"]),
  amount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be greater than zero"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface AdjustmentModalProps {
  user: UserResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userId: string, amount: number) => void;
}

export default function AdjustmentModal({ user, isOpen, onClose, onSuccess }: AdjustmentModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      actionType: "add",
      reason: "",
    },
  });

  const actionType = watch("actionType");

  if (!isOpen) return null;

  const onSubmit = (data: AdjustmentFormValues) => {
    startTransition(async () => {
      const finalAmount = data.actionType === "add" ? Math.abs(data.amount) : -Math.abs(data.amount);
      const result = await submitManualAdjustment({
        mitraId: user.id,
        amount: finalAmount,
        reason: data.reason,
      });

      if (result.success) {
        toast.success(
          `Adjustment recorded for ${user.name}: ${finalAmount > 0 ? "+" : ""}${finalAmount} tokens`
        );
        
        if (onSuccess) {
          onSuccess(user.id, finalAmount);
        }

        reset();
        onClose();
      } else {
        toast.error(result.error ?? "Adjustment failed. Please try again.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Adjust Tokens</h2>
            <p className="text-sm text-neutral-500 mt-1">For {user.name} ({user.npk})</p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="adjustment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Action Toggle */}
            <div className="flex p-1 bg-neutral-100 rounded-full">
              <button
                type="button"
                onClick={() => setValue("actionType", "add")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-full transition-all",
                  actionType === "add" ? "bg-white shadow-sm text-green-600" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                Add Tokens
              </button>
              <button
                type="button"
                onClick={() => setValue("actionType", "deduct")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-full transition-all",
                  actionType === "deduct" ? "bg-white shadow-sm text-red-600" : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                Deduct Tokens
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                {...register("amount", { valueAsNumber: true })}
                disabled={isPending}
                placeholder="e.g., 500"
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.amount ? "border-red-500 focus:ring-red-500/50" : "border-neutral-300 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)]"
                }`}
              />
              {errors.amount && <p className="mt-1.5 text-sm text-red-500">{errors.amount.message}</p>}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Reason (Mandatory) <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("reason")}
                rows={3}
                disabled={isPending}
                placeholder="Why are you adjusting these tokens?"
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 transition-all resize-none shadow-sm ${
                  errors.reason ? "border-red-500 focus:ring-red-500/50" : "border-neutral-300 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)]"
                }`}
              />
              {errors.reason && <p className="mt-1.5 text-sm text-red-500">{errors.reason.message}</p>}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 bg-neutral-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="adjustment-form"
            disabled={isPending}
            className={cn(
              "flex items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-md disabled:opacity-50 disabled:shadow-none",
              actionType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : actionType === "add" ? "Add Tokens" : "Deduct Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
}
