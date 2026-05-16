import { TableRowSkeleton } from "@/components/shared/skeleton-card";

/**
 * Admin group loading state — matches the admin table layout.
 * Displayed by Next.js App Router while server components fetch data.
 */
export default function Loading() {
  return (
    <div
      className="max-w-7xl mx-auto w-full space-y-6"
      role="status"
      aria-label="Loading admin data"
      aria-busy="true"
    >
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bento-card p-6 space-y-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-10 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="skeleton h-5 w-40 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <TableRowSkeleton rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
