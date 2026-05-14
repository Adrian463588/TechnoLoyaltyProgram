import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RewardsClient from './rewards-client'
import { RewardItem } from '@/types'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: { success: vi.fn() }
}))

// Mock next/navigation for Breadcrumb inside RewardsClient
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/employee/rewards'),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockRewards: RewardItem[] = [
  {
    id: "1",
    name: "Reward 1",
    description: "Desc 1",
    tokenCost: 1000,
    category: "Merchandise",
    isAvailable: true,
    imageUrl: undefined,
  },
  {
    id: "2",
    name: "Reward 2",
    description: "Desc 2",
    tokenCost: 5000,
    category: "Voucher",
    isAvailable: true,
    imageUrl: undefined,
  },
  {
    id: "3",
    name: "Reward 3",
    description: "Desc 3",
    tokenCost: 500,
    category: "Experience",
    isAvailable: false,
    imageUrl: undefined,
  },
]

describe('RewardsClient', () => {
  it('shows locked state when not eligible', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={false} />)
    expect(screen.getByText('Redemption Locked')).toBeInTheDocument()
  })

  it('renders rewards correctly when eligible', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} />)
    expect(screen.getByText('Reward 1')).toBeInTheDocument()
    expect(screen.getByText('Reward 2')).toBeInTheDocument()
    expect(screen.getByText('Reward 3')).toBeInTheDocument()
  })

  it('disables redeem button if not enough tokens or out of stock', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} />)
    
    // Reward 1 costs 1000, user has 4500 → enabled
    expect(screen.getByTestId('redeem-btn-1')).not.toBeDisabled()
    
    // Reward 2 costs 5000, user has 4500 → disabled
    expect(screen.getByTestId('redeem-btn-2')).toBeDisabled()
    
    // Reward 3 costs 500 but isAvailable = false → disabled
    expect(screen.getByTestId('redeem-btn-3')).toBeDisabled()
  })

  it('shows tooltip wrapper for disabled reward buttons', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} />)
    // TooltipWrapper renders role="tooltip" spans
    const tooltips = screen.getAllByRole('tooltip')
    expect(tooltips.length).toBeGreaterThan(0)
  })

  it('opens dialog and submits redemption', async () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} />)
    
    fireEvent.click(screen.getByTestId('redeem-btn-1'))
    expect(screen.getByText('Confirm Redemption')).toBeInTheDocument()
    
    fireEvent.click(screen.getByTestId('confirm-redeem-btn'))
    
    // Loading state
    expect(screen.getByTestId('confirm-redeem-btn')).toBeDisabled()
    
    // Success state with pipeline
    await waitFor(() => {
      expect(screen.getByText('Request Submitted!')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByTestId('redemption-pipeline')).toBeInTheDocument()
    expect(screen.getByTestId('done-btn')).toBeInTheDocument()
  })

  it('filters rewards by category', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} />)
    
    // Click Voucher filter
    fireEvent.click(screen.getByRole('button', { name: 'Voucher' }))
    
    // Only Reward 2 is Voucher
    expect(screen.getByText('Reward 2')).toBeInTheDocument()
    // Reward 1 is Merchandise, should not show
    expect(screen.queryByText('Reward 1')).not.toBeInTheDocument()
  })
})
