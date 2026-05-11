/**
 * BentoCard — backward-compatible wrapper
 *
 * Wraps the new GlassCard so existing page components don't
 * break before they are individually migrated to GlassCard.
 *
 * @deprecated Use `GlassCard` from `@/frontend/components/ui/glass-card` directly.
 */

import * as React from "react";
import { GlassCard } from "@/frontend/components/ui/glass-card";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  glow?: boolean;
}

export function BentoCard({ className, glow = true, ...props }: BentoCardProps) {
  return (
    <GlassCard
      variant="default"
      glow={glow}
      lift={true}
      className={className}
      {...props}
    />
  );
}
