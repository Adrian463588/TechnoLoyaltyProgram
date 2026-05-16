"use client";

import React from "react";

/** Shimmer skeleton for the rewards catalog grid */
export default function Loading() {
  return (
    <div
      className="space-y-6 animate-fade-up-in"
      role="status"
      aria-label="Loading rewards catalog"
      aria-busy="true"
    >
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-52 rounded-lg" />
          <div className="skeleton h-4 w-72 rounded" />
        </div>
        <div className="skeleton h-8 w-36 rounded-full" />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[80, 56, 96, 64, 88].map((w, i) => (
          <div key={i} className={`skeleton h-8 w-${w} rounded-full shrink-0`} />
        ))}
      </div>

      {/* Reward card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bento-card flex flex-col overflow-hidden">
            {/* Thumbnail */}
            <div className="skeleton aspect-[4/3] w-full" />
            {/* Content */}
            <div className="p-5 space-y-3 flex-1">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-7 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
