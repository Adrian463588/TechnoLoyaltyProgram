import { DashboardSkeleton } from "@/components/shared/skeleton-card";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6 min-h-[56px]" />
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <DashboardSkeleton />
      </main>
    </div>
  );
}
