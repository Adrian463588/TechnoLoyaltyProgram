"use client";

import React from "react";

export function TokenCardSkeleton() {
  return (
    <div className="bento-card p-6 space-y-4">
      {/* Label */}
      <div className="skeleton h-3 w-24 rounded" />
      {/* Hero number */}
      <div className="skeleton h-12 w-40 rounded" />
      {/* Sub-value */}
      <div className="skeleton h-3 w-32 rounded" />
      {/* Divider */}
      <div className="skeleton h-px w-full rounded" />
      {/* Footer info */}
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[--color-border-subtle]">
          <td className="p-4"><div className="skeleton h-4 w-32 rounded" /></td>
          <td className="p-4"><div className="skeleton h-4 w-20 rounded" /></td>
          <td className="p-4"><div className="skeleton h-4 w-16 rounded" /></td>
          <td className="p-4"><div className="skeleton h-6 w-24 rounded-full" /></td>
          <td className="p-4"><div className="skeleton h-4 w-8 rounded ml-auto" /></td>
        </tr>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="bento-grid"
      role="status"
      aria-label="Loading loyalty data"
      aria-busy="true"
    >
      {/* Welcome banner */}
      <div className="col-span-12 bento-card p-6">
        <div className="skeleton h-6 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>

      {/* Stat cards x3 */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="col-span-12 md:col-span-4 bento-card p-6 space-y-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-10 w-32 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      ))}

      {/* Chart area */}
      <div className="col-span-12 lg:col-span-8 bento-card p-6">
        <div className="skeleton h-4 w-40 rounded mb-4" />
        <div className="skeleton h-40 w-full rounded-lg" />
      </div>

      {/* Side panel */}
      <div className="col-span-12 lg:col-span-4 bento-card p-6 space-y-3">
        <div className="skeleton h-4 w-32 rounded mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
