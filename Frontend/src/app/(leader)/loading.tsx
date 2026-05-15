import { TableRowSkeleton } from "@/components/shared/skeleton-card";

/**
 * Leader group loading state — matches team view layout.
 */
export default function Loading() {
  return (
    <div
      className="max-w-6xl mx-auto w-full space-y-6"
      role="status"
      aria-label="Loading team data"
      aria-busy="true"
    >
      {/* Page header */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-10 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton h-9 w-16 rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>

      {/* Members table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="skeleton h-5 w-32 rounded" />
        </div>
        <table className="w-full">
          <tbody>
            <TableRowSkeleton rows={5} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
