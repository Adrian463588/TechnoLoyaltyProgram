export default function NotificationsLoading() {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted animate-pulse rounded-lg" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-48 bg-muted animate-pulse rounded-2xl" />
    </div>
  );
}
