export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="h-10 w-64 bg-white/10 rounded-xl"></div>
          <div className="h-5 w-96 bg-white/5 rounded-lg mt-4"></div>
        </div>
        <div className="h-10 w-36 bg-white/10 rounded-xl"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-white/5 bg-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-6 w-3/4 bg-white/10 rounded-lg mb-2"></div>
                <div className="h-4 w-full bg-white/5 rounded-lg"></div>
                <div className="h-4 w-2/3 bg-white/5 rounded-lg mt-1"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 mb-4">
              <div className="h-12 bg-white/5 rounded-xl"></div>
              <div className="h-12 bg-white/5 rounded-xl"></div>
            </div>
            <div className="h-10 w-full bg-white/10 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
