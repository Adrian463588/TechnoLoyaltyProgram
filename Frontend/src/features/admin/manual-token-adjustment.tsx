"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const adjustmentSchema = z.object({
  mitraId: z.string().min(1, "Mitra ID is required"),
  amount: z.coerce.number().refine(val => val !== 0, "Amount cannot be zero"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export function ManualTokenAdjustment() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
  });

  const onSubmit = (data: AdjustmentFormValues) => {
    startTransition(async () => {
      await new Promise(res => setTimeout(res, 800));
      toast.success(`Successfully adjusted ${data.amount > 0 ? "+" : ""}${data.amount} tokens for ${data.mitraId}`);
      reset();
    });
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-card-heading mb-6 text-[--color-error]">Manual Token Adjustment</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-label block mb-1">Mitra ID / Email</label>
          <input 
            {...register("mitraId")}
            className={cn("input-field", errors.mitraId && "input-field--error")}
            disabled={isPending}
            aria-invalid={!!errors.mitraId}
          />
          {errors.mitraId && <p className="text-xs text-[--color-error] mt-1 animate-fade-up-in">{errors.mitraId.message}</p>}
        </div>
        
        <div>
          <label className="text-label block mb-1">Amount (+ / -)</label>
          <input 
            type="number"
            {...register("amount")}
            className={cn("input-field", errors.amount && "input-field--error")}
            disabled={isPending}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && <p className="text-xs text-[--color-error] mt-1 animate-fade-up-in">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="text-label block mb-1">Reason (Mandatory)</label>
          <textarea 
            {...register("reason")}
            className={cn("input-field min-h-[100px] resize-none", errors.reason && "input-field--error")}
            disabled={isPending}
            aria-invalid={!!errors.reason}
          />
          {errors.reason && <p className="text-xs text-[--color-error] mt-1 animate-fade-up-in">{errors.reason.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="btn-danger w-full py-2.5 rounded-lg font-medium mt-2 flex items-center justify-center"
        >
          {isPending ? <span className="animate-pulse-ring h-4 w-4 rounded-full border-2 border-[#FCA5A5] border-t-transparent" /> : "Submit Adjustment"}
        </button>
      </form>
    </div>
  );
}
