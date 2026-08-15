export default function AdjustmentsLoading() {
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

          {/* Form Container Skeleton */}
          <div className="bento-span-12 bento-card p-8 space-y-6">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-24 w-full rounded-xl" />
            </div>
            <div className="flex justify-end gap-3">
              <div className="skeleton h-11 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
