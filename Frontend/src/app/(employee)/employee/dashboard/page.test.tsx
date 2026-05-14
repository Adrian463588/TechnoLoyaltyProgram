import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmployeeDashboardPage from './page'

// Mock the child components to avoid async rendering issues inside them if any
vi.mock('@/components/shared/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">Breadcrumb</nav>
}))

vi.mock('@/components/dashboard/token-hero-section', () => ({
  TokenHeroSection: ({ tokenBalance, tier }: any) => (
    <div data-testid="token-hero">
      <span>{tokenBalance}</span>
      <span>{tier}</span>
    </div>
  )
}))

describe('EmployeeDashboardPage', () => {
  it('renders the dashboard with correct layout after data fetch', async () => {
    // Render the async server component
    const Page = await EmployeeDashboardPage()
    render(Page)
    
    // Wait for the elements to be present
    expect(screen.getByTestId('employee-dashboard-heading')).toBeInTheDocument()

    expect(screen.getByText('Active Earning Period: P2: Jun 16 → Dec 15')).toBeInTheDocument()
    expect(screen.getByText('Earning Streak')).toBeInTheDocument()
    expect(screen.getByText('Redemption')).toBeInTheDocument()
    expect(screen.getByText('Token History')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Rewards')).toBeInTheDocument()

    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('token-hero')).toBeInTheDocument()
  })
})
