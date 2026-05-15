/**
 * GlassCard — Glassmorphism 2.0 Card primitive
 *
 * Replaces the legacy `BentoCard` with a proper glass surface
 * supporting 3 visual variants: default, elevated, and subtle.
 *
 * Principle: OCP — extend via `variant` prop, not by modifying
 * internal class lists across the codebase.
 *
 * Motion: Uses framer-motion for lift/arrive animations per DESIGN.md.
 * Respects prefers-reduced-motion via `useReducedMotion()`.
 */

"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type GlassVariant = "default" | "elevated" | "subtle";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  /** Green glow on hover */
  glow?: boolean;
  /** Lift effect on hover (uses framer-motion when available) */
  lift?: boolean;
  /** Disable glass entirely (plain surface) */
  flat?: boolean;
  /** Animate card arrival (stagger index) */
  index?: number;
}

// ── Variant class maps ─────────────────────────────────────────
const VARIANT_CLASSES: Record<GlassVariant, string> = {
  default:  "glass-card",
  elevated: "glass-card-elevated",
  subtle:   "bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm",
};

/** Spring arrival animation per DESIGN.md §6 */
function arrivalVariants(index: number, reduced: boolean) {
  if (reduced) {
    return {
      hidden:  { opacity: 1, y: 0, scale: 1 },
      visible: { opacity: 1, y: 0, scale: 1 },
    };
  }
  return {
    hidden:  { opacity: 0, y: 16, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type:     "spring" as const,
        stiffness: 280,
        damping:   22,
        delay:     index * 0.06,
      },
    },
  };
}

// ── GlassCard ─────────────────────────────────────────────────
export function GlassCard({
  variant = "default",
  glow = true,
  lift = true,
  flat = false,
  index = 0,
  className,
  children,
  ...props
}: GlassCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={arrivalVariants(index, shouldReduceMotion ?? false)}
      initial="hidden"
      animate="visible"
      whileHover={
        lift && !shouldReduceMotion
          ? { y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }
          : undefined
      }
      className={cn(
        "rounded-2xl overflow-hidden",
        flat ? "bg-white border border-slate-200 shadow-sm" : VARIANT_CLASSES[variant],
        "transition-shadow duration-300",
        glow && !flat && "hover:glass-glow-blue",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

// ── GlassCardHeader ───────────────────────────────────────────
export function GlassCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1 p-6 pb-4",
        "border-b border-white/30",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── GlassCardTitle ────────────────────────────────────────────
export function GlassCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold text-foreground leading-tight tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// ── GlassCardContent ──────────────────────────────────────────
export function GlassCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

// ── GlassCardFooter ───────────────────────────────────────────
export function GlassCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}
