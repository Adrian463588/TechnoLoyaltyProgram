"use client";

import { useEffect } from "react";

export default function Error({
  error: err,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(err);
  }, [err]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-[--color-text-primary] mb-2">
          Something went wrong
        </h2>
        <p className="text-[--color-text-secondary] mb-6">
          We encountered an error while loading this page.
        </p>
        <button
          onClick={reset}
          className="btn-primary w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}