import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// ── Mocks must be hoisted before imports ─────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { name: "Admin Test" }
  }),
  getServerToken: vi.fn().mockResolvedValue("mock-token")
}))

vi.mock('@/lib/api-client', () => ({
  adminApi: {
    listRedemptions: vi.fn().mockResolvedValue({ requests: [] }),
    listUsers: vi.fn().mockResolvedValue({ users: [] }),
    getSystemSettings: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@/components/shared/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb">Breadcrumb</nav>
}))

vi.mock('@/features/admin/redemption-queue-table', () => ({
  RedemptionQueueTable: () => <div data-testid="redemption-queue-table">Queue Table</div>
}))

vi.mock('@/components/dashboard/dashboard-clock', () => ({
  DashboardClock: () => <div data-testid="dashboard-clock">Clock</div>
}))

import AdminDashboardPage from './page'

describe('AdminDashboardPage', () => {
  it('renders the dashboard with correct layout', async () => {
    const Page = await AdminDashboardPage()
    render(Page)
    
    // Check if the dashboard header is present
    expect(screen.getByText('HC Admin Dashboard')).toBeInTheDocument()
    
    // Check for KPI cards
    expect(screen.getByText(/EMPLOYEE TIER DISTRIBUTION/i)).toBeInTheDocument()
    expect(screen.getByText('Requested Redeem')).toBeInTheDocument()
    expect(screen.getByText('Active Partners')).toBeInTheDocument()
    expect(screen.getByText(/CURRENT CYCLE/i)).toBeInTheDocument()
    
    // Check for Action Center
    expect(screen.getByText('Action Center')).toBeInTheDocument()
    expect(screen.getByText('Process Uploads')).toBeInTheDocument()
    expect(screen.getByText('Token Adjustments')).toBeInTheDocument()
    expect(screen.getByText('Status Validation')).toBeInTheDocument()
    
    // Check that the mocked components are rendered
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('redemption-queue-table')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-clock')).toBeInTheDocument()
  })
})
