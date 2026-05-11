"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutosaveIndicatorProps {
  /** When this changes to true, the indicator appears then fades */
  show: boolean;
  label?: string;
  className?: string;
}

/**
 * Fading "Saved ✓" notification for admin inline edits.
 * Pass `show={true}` to trigger it. It auto-hides after 2s.
 */
export function AutosaveIndicator({
  show,
  label = "Saved",
  className,
}: AutosaveIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-primary",
        "transition-all duration-300",
        fading ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0 animate-fade-up-in",
        className
      )}
      aria-live="polite"
      data-testid="autosave-indicator"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
