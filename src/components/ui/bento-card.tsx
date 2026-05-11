import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BentoCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  className?: string
  /** Add an extra glow ring on hover (default: true) */
  glow?: boolean
}

export function BentoCard({ className, glow = true, ...props }: BentoCardProps) {
  return (
    <Card
      className={cn(
        // Base surface
        "overflow-hidden rounded-2xl",
        "bg-card border border-border",
        // Smooth transition for all effects
        "transition-all duration-300 ease-out",
        // Hover lift
        "hover:-translate-y-1",
        // Hover shadow glow
        glow && "hover:shadow-[0_8px_32px_var(--color-green-glow)] hover:border-primary/25",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
}
