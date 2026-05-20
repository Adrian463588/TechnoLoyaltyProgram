import React from "react";

export default function TokenRulesLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="glass-nav px-6">
        <div className="py-4">
          <div className="skeleton h-4 w-48 rounded" />
        </div>
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="bento-grid">
          {/* Header skeleton */}
          <div className="bento-span-12 bento-card p-6 animate-pulse">
            <div className="skeleton h-7 w-64 rounded mb-2" />
            <div className="skeleton h-4 w-96 rounded" />
          </div>

          {/* Info banner skeleton */}
          <div className="bento-span-12 bento-card p-4 animate-pulse">
            <div className="skeleton h-4 w-full rounded" />
          </div>

          {/* Card skeletons */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bento-span-12 md:bento-span-6 bento-card p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div>
                  <div className="skeleton h-5 w-40 rounded mb-1" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[--color-surface-elevated] border border-[--color-border-subtle] mb-4">
                <div className="skeleton h-3 w-24 rounded mb-3" />
                <div className="skeleton h-10 w-24 rounded" />
              </div>
              <div className="skeleton h-3 w-48 rounded mb-4" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
