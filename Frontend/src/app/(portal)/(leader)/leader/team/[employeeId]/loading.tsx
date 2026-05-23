export default function MemberDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 p-6">
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
