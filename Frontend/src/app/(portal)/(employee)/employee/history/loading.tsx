import { BentoCard } from "@/components/ui/bento-card";

export default function HistoryLoading() {
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-32 bg-muted animate-pulse rounded-full" />
        ))}
      </div>
      <BentoCard className="overflow-hidden p-0">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </BentoCard>
    </div>
  );
}
