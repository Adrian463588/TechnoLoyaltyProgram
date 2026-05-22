"use client";

import React, { useState, useEffect } from "react";

export function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    // Use timeout to avoid synchronous setState in useEffect warning
    const timeout = setTimeout(() => setNow(new Date()), 0);
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  if (!now) return <div className="h-10 w-32 bg-neutral-100 animate-pulse rounded-xl" />;

  // Native formatting using Intl.DateTimeFormat (No extra library needed)
  const timeString = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const dateString = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-2xl font-bold text-[--color-text-primary] tabular-nums leading-none mb-3">
        {timeString}
      </div>
      <div className="text-sm font-medium text-[--color-text-tertiary] leading-none">
        {dateString}
      </div>
    </div>
  );
}
