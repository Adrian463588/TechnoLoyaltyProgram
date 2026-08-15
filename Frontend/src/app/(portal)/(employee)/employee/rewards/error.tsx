"use client";

export default function RewardsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="p-6" data-testid="employee-rewards-error">
      <div role="alert" className="bento-card p-6 space-y-3">
        <h1 className="text-card-heading">Rewards are unavailable</h1>
        <p className="text-body">The live reward catalog could not be loaded. Try again when the backend is available.</p>
        <button type="button" onClick={reset} className="btn-primary">Retry</button>
      </div>
    </main>
  );
}
