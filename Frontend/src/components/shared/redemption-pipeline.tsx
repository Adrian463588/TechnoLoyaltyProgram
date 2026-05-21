"use client";

import { CheckCircle2, Circle, FileSearch, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = "submitted" | "review" | "accepted";

const STEPS: {
  key: PipelineStep;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "submitted", label: "Request Sent",    icon: Circle },
  { key: "review",    label: "Document Review", icon: FileSearch },
  { key: "accepted",  label: "Confirmation",    icon: ShieldCheck },
];

const STEP_ORDER: PipelineStep[] = ["submitted", "review", "accepted"];

function stepIndex(step: PipelineStep): number {
  return STEP_ORDER.indexOf(step);
}

interface RedemptionPipelineProps {
  currentStep: PipelineStep;
  className?: string;
  compact?: boolean;
}

export function RedemptionPipeline({
  currentStep,
  className,
  compact = false,
}: RedemptionPipelineProps) {
  const currentIdx = stepIndex(currentStep);
  const isCompleted = currentStep === "completed";

  return (
    <div
      className={cn("w-full", className)}
      data-testid="redemption-pipeline"
    >
      <div className="flex items-center w-full">
        {STEPS.map((step, idx) => {
          const done = currentIdx > idx || (isCompleted && currentIdx === idx);
          const active = !isCompleted && currentIdx === idx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-all duration-500",
                    compact ? "w-7 h-7" : "w-10 h-10",
                    done
                      ? "bg-[var(--color-accent)] text-black shadow-md shadow-[var(--color-accent)]/20"
                      : active
                      ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-2 border-[var(--color-accent)] shadow-sm"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)]"
                  )}
                >
                  {done ? (
                    <CheckCircle2
                      className={cn(
                        "animate-success-pop",
                        compact ? "w-4 h-4" : "w-5 h-5"
                      )}
                    />
                  ) : (
                    <step.icon
                      className={cn(
                        compact ? "w-3.5 h-3.5" : "w-5 h-5",
                        !active && "opacity-40"
                      )}
                    />
                  )}
                  {/* Pulsing ring for active */}
                  {active && (
                    <span className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/50 animate-glow-ring" />
                  )}
                </div>

                {/* Label */}
                {!compact && (
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-wider uppercase",
                      done
                        ? "text-[var(--color-accent)]"
                        : active
                        ? "text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-tertiary)]"
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 transition-all duration-700 ease-out rounded-full",
                    currentIdx > idx || (isCompleted && currentIdx > idx)
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-border-subtle)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
