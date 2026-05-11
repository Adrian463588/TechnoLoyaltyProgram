import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuccessAnimation } from '@/components/shared/success-animation';

describe('SuccessAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    const { container } = render(<SuccessAnimation />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('becomes visible after 50ms delay', () => {
    render(<SuccessAnimation />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Container becomes opacity-100 (visible state set)
    const wrapper = document.querySelector('[class*="opacity-100"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<SuccessAnimation subtitle="Your request has been submitted." />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Your request has been submitted.')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SuccessAnimation />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
