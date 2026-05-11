"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  className?: string;
  /** Size in px, default 64 */
  size?: number;
  /** Optional subtitle text */
  subtitle?: string;
}

export function SuccessAnimation({ className, size = 64, subtitle }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay slightly so the parent can mount first
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-primary/15 flex items-center justify-center transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ width: size * 1.4, height: size * 1.4 }}
      >
        <div
          className={cn(
            "rounded-full bg-primary/20 flex items-center justify-center",
            visible && "animate-success-pop"
          )}
          style={{ width: size * 1.15, height: size * 1.15 }}
        >
          <CheckCircle2
            className="text-primary"
            style={{ width: size * 0.55, height: size * 0.55 }}
          />
        </div>
      </div>

      {subtitle && (
        <p
          className={cn(
            "text-sm text-muted-foreground text-center transition-all duration-300",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
