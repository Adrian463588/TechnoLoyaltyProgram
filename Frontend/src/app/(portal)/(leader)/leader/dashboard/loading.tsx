export default function LeaderDashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 md:px-6 py-4">
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card Skeleton */}
          <div className="bento-span-12 bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-14 w-14 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <div className="skeleton h-6 w-56 rounded" />
                <div className="skeleton h-4 w-80 rounded" />
              </div>
            </div>
            <div className="skeleton h-10 w-36 rounded-xl" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="bento-span-12 md:bento-span-4 bento-card p-6 space-y-3">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-10 w-24 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>
          <div className="bento-span-12 md:bento-span-4 bento-card p-6 space-y-3">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-10 w-24 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>
          <div className="bento-span-12 md:bento-span-4 bento-card p-6 space-y-3">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-10 w-24 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>

          {/* Team Table Skeleton */}
          <div className="bento-span-12 bento-card p-6 space-y-4">
            <div className="skeleton h-6 w-40 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <div className="skeleton h-4 w-32 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
