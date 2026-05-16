/**
 * BentoGrid — Advanced Bento Grid layout container
 *
 * Provides a responsive CSS Grid wrapper following the
 * Glassmorphism 2.0 design system. Children use `BentoPanel`
 * or `BentoCard` for individual panel styling.
 *
 * Principle: SRP — only responsible for layout orchestration.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns. Default: 3 on md+. */
  cols?: 2 | 3 | 4;
  /** Gap between cells. Default: 'md' */
  gap?: "sm" | "md" | "lg";
}

interface BentoPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Span across multiple columns */
  colSpan?: 1 | 2 | 3 | 4;
  /** Span across multiple rows */
  rowSpan?: 1 | 2 | 3;
  /** Enable Glassmorphism frosted-glass effect (default: true) */
  glass?: boolean;
  /** Add blue corporate glow on hover (default: true) */
  glow?: boolean;
  /** Elevated glass variant for hero panels */
  elevated?: boolean;
}

// ── Constants ──────────────────────────────────────────────────
const COL_MAP: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

const GAP_MAP: Record<"sm" | "md" | "lg", string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

const COL_SPAN_MAP: Record<1 | 2 | 3 | 4, string> = {
  1: "col-span-1",
  2: "col-span-1 md:col-span-2",
  3: "col-span-1 md:col-span-3",
  4: "col-span-1 md:col-span-2 lg:col-span-4",
};

const ROW_SPAN_MAP: Record<1 | 2 | 3, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

// ── BentoGrid ─────────────────────────────────────────────────
export function BentoGrid({
  cols = 3,
  gap = "md",
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn("grid", COL_MAP[cols], GAP_MAP[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ── BentoPanel ────────────────────────────────────────────────
export function BentoPanel({
  colSpan = 1,
  rowSpan = 1,
  glass = true,
  glow = true,
  elevated = false,
  className,
  children,
  ...props
}: BentoPanelProps) {
  return (
    <div
      className={cn(
        // Layout
        COL_SPAN_MAP[colSpan],
        ROW_SPAN_MAP[rowSpan],
        // Shape
        "rounded-2xl overflow-hidden",
        // Glassmorphism base
        glass && (elevated ? "bento-card-elevated" : "bento-card"),
        // Hover transitions
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5",
        // Glow on hover
        glow && "hover:glass-glow-blue",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
