/**
 * Loading skeleton for the leader alerts page (partner confirmations).
 */
export default function Loading() {
  return (
    <div
      className="max-w-4xl mx-auto w-full space-y-8"
      role="status"
      aria-label="Loading team alerts"
      aria-busy="true"
    >
      <div className="space-y-2">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bento-card p-4 space-y-3">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-10 w-10 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Confirmation cards */}
      <div className="space-y-3">
        <div className="skeleton h-4 w-36 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bento-card p-5 flex items-start gap-4">
            <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-8 w-20 rounded-lg" />
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
