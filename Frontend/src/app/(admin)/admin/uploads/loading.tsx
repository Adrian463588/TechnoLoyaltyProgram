import { TableRowSkeleton } from "@/components/shared/skeleton-card";

/**
 * Loading state for the admin uploads page.
 * Shown by Next.js App Router while the server component fetches upload history.
 */
export default function Loading() {
  return (
    <div
      className="max-w-7xl mx-auto w-full space-y-6"
      role="status"
      aria-label="Loading upload history"
      aria-busy="true"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-52 rounded-lg" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
      </div>

      {/* Dropzone placeholder */}
      <div className="bento-card p-8 flex flex-col items-center gap-4 border-2 border-dashed border-white/10">
        <div className="skeleton h-14 w-14 rounded-2xl" />
        <div className="skeleton h-4 w-48 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-9 w-36 rounded-lg mt-2" />
      </div>

      {/* Upload history table */}
      <div className="bento-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="skeleton h-5 w-36 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
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
