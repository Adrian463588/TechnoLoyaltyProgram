"use client";

import { CheckCircle2, Circle, Package, ShoppingCart, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = "submitted" | "verified" | "purchased" | "pickup" | "completed";

const STEPS: {
  key: PipelineStep;
  label: string;
  icon: React.ElementType;
  completedAt?: PipelineStep;
}[] = [
  { key: "submitted", label: "Submit",  icon: Circle },
  { key: "verified",  label: "Verify",  icon: CheckCircle2 },
  { key: "purchased", label: "Purchase", icon: ShoppingCart },
  { key: "pickup",    label: "Pickup",  icon: Truck },
];

const STEP_ORDER: PipelineStep[] = ["submitted", "verified", "purchased", "pickup", "completed"];

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
          const done = isCompleted || currentIdx > idx;
          const active = !isCompleted && currentIdx === idx;
          const pending = !done && !active;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-all duration-500",
                    compact ? "w-7 h-7" : "w-9 h-9",
                    done
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(124,196,70,0.4)]"
                      : active
                      ? "bg-primary/20 text-primary border-2 border-primary animate-glow-ring"
                      : "bg-muted/50 text-muted-foreground border border-border"
                  )}
                >
                  {done ? (
                    <CheckCircle2
                      className={cn(
                        "animate-success-pop",
                        compact ? "w-4 h-4" : "w-5 h-5"
                      )}
                    />
                  ) : active ? (
                    <step.icon
                      className={cn(
                        compact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"
                      )}
                    />
                  ) : (
                    <step.icon
                      className={cn(
                        "opacity-40",
                        compact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"
                      )}
                    />
                  )}
                  {/* Pulsing ring for active */}
                  {active && (
                    <span className="absolute inset-0 rounded-full border-2 border-primary/50 animate-glow-ring" />
                  )}
                </div>

                {/* Label */}
                {!compact && (
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      done
                        ? "text-primary"
                        : active
                        ? "text-foreground"
                        : "text-muted-foreground"
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
                    done ? "bg-primary shadow-[0_0_4px_rgba(124,196,70,0.5)]" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}

        {/* Final "Completed" node */}
        <div className="flex flex-col items-center gap-1 ml-1">
          <div
            className={cn(
              "flex items-center justify-center rounded-full transition-all duration-500",
              compact ? "w-7 h-7" : "w-9 h-9",
              isCompleted
                ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(124,196,70,0.4)]"
                : "bg-muted/50 text-muted-foreground border border-border opacity-40"
            )}
          >
            <Package className={compact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
          </div>
          {!compact && (
            <span
              className={cn(
                "text-[10px] font-medium",
                isCompleted ? "text-primary" : "text-muted-foreground"
              )}
            >
              Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
