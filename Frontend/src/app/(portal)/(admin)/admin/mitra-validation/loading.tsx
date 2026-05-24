import { TableRowSkeleton } from "@/components/shared/skeleton-card";

export default function MitraValidationLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Skeleton */}
      <div className="h-16 border-b border-[var(--color-border-subtle)] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card Skeleton */}
          <div className="bento-span-12 bento-card p-6 space-y-2 animate-fade-up-in">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-4 w-80 rounded" />
          </div>

          {/* Table Container Skeleton */}
          <div className="bento-span-12 bento-card p-0 overflow-hidden border-[var(--color-border-subtle)]">
            {/* Table Toolbar */}
            <div className="p-5 border-b border-[var(--color-border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/30">
              <div className="skeleton h-10 w-full md:w-80 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="skeleton h-9 w-24 rounded-lg" />
                <div className="skeleton h-9 w-24 rounded-lg" />
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] bg-neutral-50/50">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i} className="px-6 py-4">
                        <div className="skeleton h-4 w-24 rounded" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableRowSkeleton rows={10} />
                </tbody>
              </table>
            </div>

            {/* Pagination Skeleton */}
            <div className="p-5 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-9 w-9 rounded-lg" />
                <div className="skeleton h-9 w-9 rounded-lg" />
                <div className="skeleton h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
