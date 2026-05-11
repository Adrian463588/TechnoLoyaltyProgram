/**
 * useCountUp — Animated number counter hook
 *
 * Pure presentational hook. Counts from 0 to `target` over
 * `duration`ms with a cubic ease-out curve.
 *
 * Principle: SRP — isolated counter logic, reusable anywhere.
 */

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  target: number,
  duration: number = 1400,
  delay: number = 200
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startAt = Date.now() + delay;

    function tick() {
      const now = Date.now();
      if (now < startAt) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}
