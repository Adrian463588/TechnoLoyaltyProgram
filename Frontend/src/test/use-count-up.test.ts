import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountUp } from '../hooks/use-count-up';

describe('useCountUp hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes at 0 and counts up to target', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toBe(100);
  });
});
