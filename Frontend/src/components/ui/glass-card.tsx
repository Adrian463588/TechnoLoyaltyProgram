/**
 * GlassCard — Glassmorphism 2.0 Card primitive
 *
 * Replaces the legacy `BentoCard` with a proper glass surface
 * supporting 3 visual variants: default, elevated, and subtle.
 *
 * Principle: OCP — extend via `variant` prop, not by modifying
 * internal class lists across the codebase.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type GlassVariant = "default" | "elevated" | "subtle";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  /** Blue corporate glow on hover */
  glow?: boolean;
  /** Lift effect on hover */
  lift?: boolean;
  /** Disable glass entirely (plain white surface) */
  flat?: boolean;
}

// ── Variant class maps ─────────────────────────────────────────
const VARIANT_CLASSES: Record<GlassVariant, string> = {
  default:  "glass-card",
  elevated: "glass-card-elevated",
  subtle:   "bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm",
};

// ── GlassCard ─────────────────────────────────────────────────
export function GlassCard({
  variant = "default",
  glow = true,
  lift = true,
  flat = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        // Visual surface
        flat ? "bg-white border border-slate-200 shadow-sm" : VARIANT_CLASSES[variant],
        // Micro-interactions
        "transition-all duration-300 ease-out",
        lift  && "hover:-translate-y-0.5",
        glow  && !flat && "hover:glass-glow-blue",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
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
        className
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
        className
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
      className={cn(
        "flex items-center p-6 pt-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
