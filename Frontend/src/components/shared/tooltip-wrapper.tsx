"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipWrapperProps {
  /** Tooltip text to show on hover */
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Only show tooltip when this is true (default: always show) */
  disabled?: boolean;
}

/**
 * Wraps any element with a CSS-only tooltip.
 * When `disabled` is true (e.g. for a disabled button), the tooltip explains why.
 */
export function TooltipWrapper({
  label,
  children,
  className,
  disabled = true,
}: TooltipWrapperProps) {
  if (!disabled) return <>{children}</>;

  return (
    <span
      className={cn("relative inline-flex group", className)}
      tabIndex={0}
      role="tooltip"
      aria-label={label}
    >
      {children}

      {/* Tooltip bubble */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
          "px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap",
          "bg-foreground text-background shadow-lg",
          "opacity-0 -translate-y-1 transition-all duration-200",
          "group-hover:opacity-100 group-hover:translate-y-0",
          "group-focus:opacity-100 group-focus:translate-y-0"
        )}
        role="tooltip"
      >
        {label}
        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  );
}
