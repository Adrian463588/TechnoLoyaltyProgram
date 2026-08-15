"use client";

export default function TeamError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="p-6" data-testid="leader-team-error">
      <div role="alert" className="bento-card p-6 space-y-3">
        <h1 className="text-card-heading">Team data is unavailable</h1>
        <p className="text-body">The team summary could not be loaded. Try again when the backend is available.</p>
        <button type="button" onClick={reset} className="btn-primary">Retry</button>
      </div>
    </main>
  );
}
