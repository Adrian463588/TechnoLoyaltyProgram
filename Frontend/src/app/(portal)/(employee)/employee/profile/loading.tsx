export default function EmployeeProfileLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 md:px-6 py-4">
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="bento-grid">
          {/* Header Card Skeleton */}
          <div className="bento-span-12 bento-card p-6 flex items-center gap-4">
            <div className="skeleton h-16 w-16 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="skeleton h-6 w-48 rounded" />
              <div className="skeleton h-4 w-64 rounded" />
            </div>
          </div>

          {/* Profile Form Details */}
          <div className="bento-span-12 md:bento-span-6 bento-card p-6 space-y-6">
            <div className="skeleton h-6 w-36 rounded" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>

          {/* Password Security */}
          <div className="bento-span-12 md:bento-span-6 bento-card p-6 space-y-6">
            <div className="skeleton h-6 w-36 rounded" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
