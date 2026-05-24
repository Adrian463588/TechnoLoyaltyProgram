export default function EarningPeriodLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Skeleton */}
      <div className="h-16 border-b border-[var(--color-border-subtle)] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card Skeleton */}
          <div className="bento-span-12 bento-card p-6 space-y-2">
            <div className="skeleton h-8 w-64 rounded-lg" />
            <div className="skeleton h-4 w-96 rounded" />
          </div>

          {/* Configuration Card Skeleton */}
          <div className="bento-span-12 bento-card p-0 overflow-hidden border-[var(--color-border-subtle)]">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>

            <div className="p-8 space-y-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="skeleton h-4 w-40 rounded border-l-4 border-slate-200 pl-3" />
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[24px] border border-[var(--color-border-subtle)] bg-neutral-50/50">
                    <div className="flex-1 w-full space-y-3">
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="flex gap-2">
                        <div className="skeleton h-11 flex-1 rounded-xl" />
                        <div className="skeleton h-11 w-[84px] rounded-xl" />
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="skeleton h-5 w-5 rounded-full" />
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="flex gap-2">
                        <div className="skeleton h-11 flex-1 rounded-xl" />
                        <div className="skeleton h-11 w-[84px] rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Save Action Skeleton */}
          <div className="bento-span-12 bento-card p-8 flex flex-col sm:flex-row items-center justify-between gap-8 rounded-[32px]">
            <div className="flex items-center gap-5">
              <div className="skeleton h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-4 w-80 rounded" />
              </div>
            </div>
            <div className="skeleton h-14 w-40 rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
