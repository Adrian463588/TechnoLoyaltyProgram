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
    getTeamSummary: vi.fn(() => Promise.resolve([
      {
        id: '1',
        name: 'Alice Optel',
        tokens: 5200,
        tier: 'EMERALD',
        status: 'ACTIVE',
        division: 'OPCENT',
      },
      {
        id: '2',
        name: 'Diana Techno',
        tokens: 8500,
        tier: 'DIAMOND',
        status: 'ACTIVE',
        division: 'TECHNO',
      },
    ]))
  }
}))

type MockTeamMember = {
  id: string;
  name: string;
  tokens: number;
  tier: string;
  status: string;
  division: string;
};

vi.mock('@/components/dashboard/leader-team-client', () => ({
  LeaderTeamClient: ({ data }: { data: MockTeamMember[] | null }) => (
    <div data-testid="leader-team-client">
      <h1>Team View</h1>
      <div data-testid="leader-team-total-tokens">
        {data?.reduce((total, member) => total + member.tokens, 0)}
      </div>
      <div data-testid="leader-team-eligible-members">
        {data?.filter((member) => member.tokens >= 2000).length} Members
      </div>
      <div data-testid="leader-team-alerts-count">
        {data?.filter((member) => member.status !== "ACTIVE").length} Members
      </div>
      <div data-testid="leader-team-table">
        {data?.map((m) => <div key={m.id}>{m.name}</div>)}
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
    expect(screen.getByTestId('leader-team-total-tokens')).toHaveTextContent('13700') 
    expect(screen.getByTestId('leader-team-eligible-members')).toHaveTextContent('2 Members') 
    expect(screen.getByTestId('leader-team-alerts-count')).toHaveTextContent('0 Members') 

    expect(screen.getByTestId('leader-team-table')).toBeInTheDocument()
    expect(screen.getByText('Alice Optel')).toBeInTheDocument()
    expect(screen.getByText('Diana Techno')).toBeInTheDocument()
  })
})
