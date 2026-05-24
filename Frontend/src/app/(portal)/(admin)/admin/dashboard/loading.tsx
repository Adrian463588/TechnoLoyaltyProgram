import { TableRowSkeleton } from "@/components/shared/skeleton-card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Skeleton */}
      <div className="h-16 border-b border-[var(--color-border-subtle)] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card Skeleton */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-start justify-between">
            <div className="space-y-3">
              <div className="skeleton h-8 w-64 rounded-lg" />
              <div className="skeleton h-4 w-80 rounded" />
              <div className="skeleton h-3 w-72 rounded" />
            </div>
            <div className="skeleton h-12 w-48 rounded-xl" />
          </div>

          {/* KPI Cards Skeleton */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bento-span-12 md:bento-span-3 bento-card p-6 space-y-4">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-10 w-20 rounded-lg" />
            </div>
          ))}

          {/* Action Center Skeleton */}
          <div className="bento-span-12 bento-card p-8 space-y-8">
            <div className="space-y-2">
              <div className="skeleton h-6 w-40 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl border border-[var(--color-border-subtle)] p-6 space-y-4">
                  <div className="skeleton h-12 w-12 rounded-2xl" />
                  <div className="skeleton h-5 w-40 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bento-span-12 bento-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  <TableRowSkeleton rows={5} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
