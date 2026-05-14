import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TeamLeaderPage from './page'

describe('TeamLeaderPage', () => {
  it('renders the team view with correct layout', () => {
    render(<TeamLeaderPage />)
    
    // Check if the dashboard header is present
    expect(screen.getByText('Team View')).toBeInTheDocument()
    
    // Check for team summary cards
    expect(screen.getByText('Team Aggregate Tokens')).toBeInTheDocument()
    expect(screen.getByTestId('leader-team-total-tokens')).toBeInTheDocument()
    
    expect(screen.getByText('Eligible for Rewards')).toBeInTheDocument()
    expect(screen.getByTestId('leader-team-eligible-members')).toBeInTheDocument()
    
    expect(screen.getByText('Alerts (Reset/Downgrade)')).toBeInTheDocument()
    expect(screen.getByTestId('leader-team-alerts-count')).toBeInTheDocument()
    
    // Check for team members table
    expect(screen.getByTestId('leader-team-table')).toBeInTheDocument()
    expect(screen.getByText('Alice Optel')).toBeInTheDocument()
    expect(screen.getByText('Diana Techno')).toBeInTheDocument()
  })

  it('displays the correct data from dummy state', () => {
    render(<TeamLeaderPage />)
    
    // Check aggregation
    expect(screen.getByTestId('leader-team-total-tokens')).toHaveTextContent('17,900') // 5200+1200+0+8500+3000
    expect(screen.getByTestId('leader-team-eligible-members')).toHaveTextContent('3 Members') // Alice, Diana, Eve
    expect(screen.getByTestId('leader-team-alerts-count')).toHaveTextContent('2 Members') // Bob and Charlie
  })
})
