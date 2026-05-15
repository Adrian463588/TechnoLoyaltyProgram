import { TableRowSkeleton } from "@/components/shared/skeleton-card";

export default function Loading() {
  return (
    <div
      className="max-w-7xl mx-auto w-full space-y-6"
      role="status"
      aria-label="Loading redemptions"
      aria-busy="true"
    >
      <div className="space-y-2">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
        <table className="w-full">
          <tbody>
            <TableRowSkeleton rows={7} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
