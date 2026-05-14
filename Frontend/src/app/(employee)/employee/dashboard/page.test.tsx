import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import EmployeeDashboardPage from './page'

// Mock next/navigation for Breadcrumb
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/employee/dashboard'),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('EmployeeDashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows skeleton loading state initially', () => {
    render(<EmployeeDashboardPage />)
    expect(document.querySelector('[class*="animate-skeleton"]')).toBeInTheDocument()
  })

  it('renders the dashboard heading after loading resolves', () => {
    render(<EmployeeDashboardPage />)
    act(() => { vi.advanceTimersByTime(1500) })
    // h1 specifically
    expect(screen.getByRole('heading', { level: 1, name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText('Total Tokens Earned')).toBeInTheDocument()
    expect(screen.getByTestId('employee-dashboard-total-tokens-value')).toBeInTheDocument()
    expect(screen.getByTestId('employee-dashboard-tier-progress')).toBeInTheDocument()
    // Text depends on eligibility — matches either state
    expect(
      screen.queryByText('Unlocked!') ?? screen.queryByText('Locked')
    ).not.toBeNull()
    expect(screen.getByTestId('employee-dashboard-redeem-button')).toBeInTheDocument()
    expect(screen.getByText('Recent Ledger')).toBeInTheDocument()
  })

  it('renders recent activities correctly after loading', () => {
    render(<EmployeeDashboardPage />)
    act(() => { vi.advanceTimersByTime(1500) })

    expect(screen.getByTestId('employee-dashboard-activity-1')).toBeInTheDocument()
    expect(screen.getByTestId('employee-dashboard-activity-1')).toHaveTextContent('Optel Slot')
    expect(screen.getByTestId('employee-dashboard-activity-1')).toHaveTextContent('+500')

    expect(screen.getByTestId('employee-dashboard-activity-2')).toBeInTheDocument()
    expect(screen.getByTestId('employee-dashboard-activity-2')).toHaveTextContent('Techno Sprint')
    expect(screen.getByTestId('employee-dashboard-activity-2')).toHaveTextContent('+1,200')
  })

  it('renders breadcrumb nav after loading', () => {
    render(<EmployeeDashboardPage />)
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('displays the token counter element after loading', () => {
    render(<EmployeeDashboardPage />)
    act(() => { vi.advanceTimersByTime(1500) })
    // Counter element exists — exact value depends on rAF animation, just check it renders
    const counter = screen.getByTestId('employee-dashboard-total-tokens-value')
    expect(counter).toBeInTheDocument()
    expect(counter.textContent).toBeTruthy()
  })
})
