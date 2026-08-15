export default function LeaderRedemptionsLoading() {
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
          </div>

          {/* Table Container Skeleton */}
          <div className="bento-span-12 bento-card p-6 space-y-4">
            <div className="skeleton h-6 w-48 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1 max-w-sm">
                      <div className="skeleton h-4 w-40 rounded" />
                      <div className="skeleton h-3 w-28 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-9 w-24 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
