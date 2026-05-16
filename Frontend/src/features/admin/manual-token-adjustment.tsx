"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { submitManualAdjustment } from "./actions";

const adjustmentSchema = z.object({
  mitraId: z.string().min(1, "Mitra ID is required"),
  amount: z
    .number({ message: "Amount is required" })
    .refine((val) => val !== 0, "Amount cannot be zero"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

/**
 * ManualTokenAdjustment — HC-01
 *
 * Sends a manual token adjustment via server action.
 * The actual append-only ledger write happens on the backend.
 * Displays real error feedback on failure.
 */
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
      const result = await submitManualAdjustment(data);
      if (result.success) {
        toast.success(
          `Adjustment recorded — ${data.amount > 0 ? "+" : ""}${data.amount} tokens`,
        );
        reset();
      } else {
        toast.error(result.error ?? "Adjustment failed. Please try again.");
      }
    });
  };

  return (
    <motion.div
      className="bento-card p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <h3 className="text-card-heading mb-6 text-[--color-error]">
        Manual Token Adjustment
      </h3>

      <div className="space-y-4">
        {/* Mitra ID */}
        <div>
          <label className="text-label block mb-1" htmlFor="adj-mitra-id">
            Mitra ID / Email
          </label>
          <input
            id="adj-mitra-id"
            data-testid="adj-mitra-id"
            {...register("mitraId")}
            className={cn("input-field", errors.mitraId && "input-field--error")}
            disabled={isPending}
            aria-invalid={!!errors.mitraId}
            aria-describedby={errors.mitraId ? "adj-mitra-error" : undefined}
          />
          <p
            id="adj-mitra-error"
            role="alert"
            className={cn(
              "text-xs text-[--color-error] mt-1 transition-opacity duration-200",
              errors.mitraId ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            )}
          >
            {errors.mitraId?.message ?? "\u00a0"}
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="text-label block mb-1" htmlFor="adj-amount">
            Amount (+ / -)
          </label>
          <input
            id="adj-amount"
            type="number"
            {...register("amount", { valueAsNumber: true })}
            className={cn("input-field", errors.amount && "input-field--error")}
            disabled={isPending}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "adj-amount-error" : undefined}
          />
          <p
            id="adj-amount-error"
            role="alert"
            className={cn(
              "text-xs text-[--color-error] mt-1 transition-opacity duration-200",
              errors.amount ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            )}
          >
            {errors.amount?.message ?? "\u00a0"}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="text-label block mb-1" htmlFor="adj-reason">
            Reason (Mandatory)
          </label>
          <textarea
            id="adj-reason"
            {...register("reason")}
            className={cn(
              "input-field min-h-[100px] resize-none",
              errors.reason && "input-field--error",
            )}
            disabled={isPending}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "adj-reason-error" : undefined}
          />
          <p
            id="adj-reason-error"
            role="alert"
            className={cn(
              "text-xs text-[--color-error] mt-1 transition-opacity duration-200",
              errors.reason ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
            )}
          >
            {errors.reason?.message ?? "\u00a0"}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: isPending ? 1 : 1.02 }}
          whileTap={{ scale: isPending ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          type="button"
          onClick={() => { void handleSubmit(onSubmit)(); }}
          disabled={isPending}
          data-testid="submit-adjustment-btn"
          className="btn-danger w-full py-2.5 rounded-lg font-medium mt-2 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-[#FCA5A5] border-t-transparent animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Adjustment"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
