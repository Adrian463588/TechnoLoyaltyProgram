import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodProgressProps {
  periodName: string;
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function PeriodProgress({ periodName, startDate, endDate, className }: PeriodProgressProps) {
  const now = new Date();
  const totalMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = Math.max(0, Math.min(now.getTime() - startDate.getTime(), totalMs));
  const progressPercent = Math.round((elapsedMs / totalMs) * 100);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <CalendarDays className="w-4 h-4" />
          <span>{periodName}</span>
        </div>
        <span className="text-xs font-semibold text-foreground">
          {daysRemaining}d remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(startDate)}</span>
        <span className="font-medium text-primary">{progressPercent}% elapsed</span>
        <span>{formatDate(endDate)}</span>
      </div>
    </div>
  );
}
