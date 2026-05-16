import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  interactive?: boolean;
  featured?: boolean;
  variant?: "default" | "elevated";
  glow?: boolean;
}

export function BentoCard({ 
  className, 
  interactive, 
  featured, 
  variant: _variant,
  glow: _glow,
  ...props 
}: BentoCardProps) {
  return (
    <section
      className={cn("bento-card", className)}
      data-interactive={interactive ? "true" : undefined}
      data-featured={featured ? "true" : undefined}
      {...props}
    />
  );
}

export function GlassCard({ className, variant = "default", glow = false, ...props }: BentoCardProps) {
  return (
    <BentoCard
      className={cn(
        variant === "elevated" && "variant-elevated",
        glow && "glow",
        className
      )}
      variant={variant}
      glow={glow}
      {...props}
    />
  );
}
