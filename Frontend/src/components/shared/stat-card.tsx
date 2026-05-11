import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: "primary" | "secondary" | "destructive" | "muted";
  className?: string;
  "data-testid"?: string;
}

const accentConfig = {
  primary: {
    wrapper: "bg-primary/5 border-primary/20",
    icon: "bg-primary/15 text-primary",
    label: "text-primary",
  },
  secondary: {
    wrapper: "bg-secondary/5 border-secondary/20",
    icon: "bg-secondary/15 text-secondary",
    label: "text-secondary",
  },
  destructive: {
    wrapper: "bg-destructive/5 border-destructive/20",
    icon: "bg-destructive/15 text-destructive",
    label: "text-destructive",
  },
  muted: {
    wrapper: "bg-muted/30 border-border",
    icon: "bg-muted text-muted-foreground",
    label: "text-muted-foreground",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent = "muted",
  className,
  "data-testid": testId,
}: StatCardProps) {
  const styles = accentConfig[accent];

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-6 transition-colors",
        styles.wrapper,
        className
      )}
      data-testid={testId}
    >
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xs font-semibold uppercase tracking-wider", styles.label)}>
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground truncate">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}
