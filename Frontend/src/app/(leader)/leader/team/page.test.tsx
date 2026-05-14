import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TeamLeaderPage from './page'

// Mock the auth and api
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  getServerToken: vi.fn(() => 'dummy-token'),
}))

vi.mock('@/lib/api-client', () => ({
  leaderApi: {
    getTeamSummary: vi.fn(() => Promise.resolve({
      totalTokens: 17900,
      eligibleMembers: 3,
      alertsCount: 2,
      members: [
        { id: '1', name: 'Alice Optel' },
        { id: '2', name: 'Diana Techno' }
      ]
    }))
  }
}))

vi.mock('@/components/dashboard/leader-team-client', () => ({
  LeaderTeamClient: ({ data }: any) => (
    <div data-testid="leader-team-client">
      <h1>Team View</h1>
      <div data-testid="leader-team-total-tokens">{data?.totalTokens}</div>
      <div data-testid="leader-team-eligible-members">{data?.eligibleMembers} Members</div>
      <div data-testid="leader-team-alerts-count">{data?.alertsCount} Members</div>
      <div data-testid="leader-team-table">
        {data?.members?.map((m: any) => <div key={m.id}>{m.name}</div>)}
      </div>
    </div>
  )
}))

describe('TeamLeaderPage', () => {
  it('renders the team view with correct layout and data', async () => {
    // Render the async server component
    const Page = await TeamLeaderPage()
    render(Page)
    
    // Check if the dashboard header is present
    await waitFor(() => {
      expect(screen.getByText('Team View')).toBeInTheDocument()
    })
    
    // Check aggregation
    expect(screen.getByTestId('leader-team-total-tokens')).toHaveTextContent('17900') 
    expect(screen.getByTestId('leader-team-eligible-members')).toHaveTextContent('3 Members') 
    expect(screen.getByTestId('leader-team-alerts-count')).toHaveTextContent('2 Members') 

    expect(screen.getByTestId('leader-team-table')).toBeInTheDocument()
    expect(screen.getByText('Alice Optel')).toBeInTheDocument()
    expect(screen.getByText('Diana Techno')).toBeInTheDocument()
  })
})
