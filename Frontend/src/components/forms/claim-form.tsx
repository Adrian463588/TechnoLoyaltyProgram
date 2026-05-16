"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const claimSchema = z.object({
  division: z.enum(["OPCENT", "TECHNO"], {
    message: "Please select a division.",
  }),
  date: z.string().min(1, "Date is required"),
  amount: z.number({ message: "Amount is required" }).min(1, "Amount must be at least 1"),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export function ClaimForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      amount: 1,
    },
  });

  const onSubmit = (_data: ClaimFormValues) => {
    startTransition(async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Claim submitted successfully.");
      reset();
    });
  };

  return (
    <div className="bento-card p-6 w-full max-w-md mx-auto">
      <h3 className="text-card-heading mb-6">Submit Claim</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="division" className="text-label block mb-1">
            Division
          </label>
          <select
            id="division"
            {...register("division")}
            className={cn(
              "input-field appearance-none",
              errors.division && "input-field--error"
            )}
            disabled={isPending}
          >
            <option value="" disabled hidden>
              Select division
            </option>
            <option value="OPCENT">Opcent & Tele (Slots)</option>
            <option value="TECHNO">Techno Center (Projects)</option>
          </select>
          {errors.division && (
            <p className="text-xs text-[--color-error] animate-fade-up-in mt-1">
              {errors.division.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-label block mb-1">
            Date Completed
          </label>
          <input
            type="date"
            id="date"
            {...register("date")}
            className={cn(
              "input-field",
              errors.date && "input-field--error"
            )}
            disabled={isPending}
            aria-invalid={!!errors.date}
          />
          {errors.date && (
            <p className="text-xs text-[--color-error] animate-fade-up-in mt-1">
              {errors.date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-label block mb-1">
            Amount (Slots/Projects)
          </label>
          <input
            type="number"
            id="amount"
            {...register("amount", { valueAsNumber: true })}
            className={cn(
              "input-field",
              errors.amount && "input-field--error"
            )}
            min="1"
            placeholder="e.g. 5"
            disabled={isPending}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && (
            <p className="text-xs text-[--color-error] animate-fade-up-in mt-1">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[--color-border-subtle]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            type="submit"
            disabled={isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span className="animate-pulse-ring h-4 w-4 rounded-full border-2 border-[#0F172A] border-t-transparent" />
            ) : (
              "Submit Claim"
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
