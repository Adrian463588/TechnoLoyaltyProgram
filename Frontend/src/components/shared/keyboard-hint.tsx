import { cn } from "@/lib/utils";

interface KeyboardHintProps {
  /** Array of key labels, e.g. ["Ctrl", "K"] */
  keys: string[];
  className?: string;
}

/**
 * Renders styled <kbd> chips for keyboard shortcut hints.
 * Example: <KeyboardHint keys={["Ctrl", "K"]} />
 */
export function KeyboardHint({ keys, className }: KeyboardHintProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 select-none",
        className
      )}
      aria-label={`Keyboard shortcut: ${keys.join(" + ")}`}
    >
      {keys.map((key, idx) => (
        <span key={idx} className="flex items-center gap-0.5">
          <kbd
            className={cn(
              "inline-flex items-center justify-center",
              "px-1.5 py-0.5 rounded-md",
              "text-[10px] font-semibold font-mono",
              "bg-muted border border-border text-muted-foreground",
              "shadow-[0_1px_0_rgba(255,255,255,0.1)]",
              "min-w-[20px]"
            )}
          >
            {key}
          </kbd>
          {idx < keys.length - 1 && (
            <span className="text-[10px] text-muted-foreground/60">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
