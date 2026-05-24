import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminDashboardPage from './page'

// Mock the child components to simplify testing the layout shell
vi.mock('@/components/shared/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">Breadcrumb</nav>
}))
vi.mock('@/features/admin/redemption-queue-table', () => ({
  RedemptionQueueTable: () => <div data-testid="redemption-queue-table">Queue Table</div>
}))
vi.mock('@/features/admin/manual-token-adjustment', () => ({
  ManualTokenAdjustment: () => <div data-testid="manual-token-adjustment">Manual Adjustment</div>
}))

describe('AdminDashboardPage', () => {
  it('renders the dashboard with correct layout', () => {
    render(<AdminDashboardPage />)
    
    // Check if the dashboard header is present
    expect(screen.getByText('HC Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/Active Earning Period:/)).toBeInTheDocument()
    
    // Check for KPI cards
    expect(screen.getByText('Uploads This Month')).toBeInTheDocument()
    expect(screen.getByText('Pending Redeem')).toBeInTheDocument()
    expect(screen.getByText('Active Partners')).toBeInTheDocument()
    expect(screen.getByText('Tokens Issued')).toBeInTheDocument()
    
    // Check for the recent upload activity table
    expect(screen.getByText('Recent Upload Activity')).toBeInTheDocument()

    // Check for Quick Actions
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Upload Data File')).toBeInTheDocument()
    
    // Check that the mocked components are rendered
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('redemption-queue-table')).toBeInTheDocument()
    expect(screen.getByTestId('manual-token-adjustment')).toBeInTheDocument()
  })
})
