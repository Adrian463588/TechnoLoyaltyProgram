import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Breadcrumb } from '@/components/shared/breadcrumb';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/employee/dashboard'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Breadcrumb', () => {
  it('renders without crashing', () => {
    render(<Breadcrumb />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders segment labels for /employee/dashboard', () => {
    render(<Breadcrumb />);
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('marks the last segment as current page', () => {
    render(<Breadcrumb />);
    const current = screen.getByText('Dashboard');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('does not render a link for the last segment', () => {
    render(<Breadcrumb />);
    // "Dashboard" is a span, not an anchor
    const current = screen.getByText('Dashboard');
    expect(current.tagName).not.toBe('A');
  });
});
