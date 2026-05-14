"use client";

import { useCountUp } from "@/hooks/use-count-up";

export function AnimatedTokenCount({ value }: { value: number }) {
  const count = useCountUp(value);
  return (
    <span aria-label={`${value} tokens`}>
      {count.toLocaleString()}
    </span>
  );
}
