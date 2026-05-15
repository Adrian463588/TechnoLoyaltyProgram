"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Admin group error boundary — shown when a server component throws.
 * Provides a retry action via Next.js reset() mechanism.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto w-full flex items-center justify-center min-h-[60vh]">
      <div className="glass-card p-10 flex flex-col items-center text-center space-y-5 max-w-md">
        <div className="p-4 rounded-full bg-[--color-error]/10 text-[--color-error] ring-2 ring-[--color-error]/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message ?? "Failed to load admin data. Please try again."}
          </p>
        </div>
        <button
          onClick={reset}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
