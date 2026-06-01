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
  useRouter: vi.fn(() => ({ refresh: vi.fn() }))
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
  getServerToken: vi.fn().mockResolvedValue("mock-token")
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  employeeApi: {
    getDocuments: vi.fn().mockResolvedValue([
      { type: 'ID_CARD_MITRA' },
      { type: 'KTP' },
      { type: 'NPWP' }
    ])
  }
}))

vi.mock('@/features/redemptions/actions', () => ({
  submitRedemptionRequest: vi.fn().mockResolvedValue({ success: true })
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
    stock: 100,
    minTier: "SAPHIRE",
  },
  {
    id: "2",
    name: "Reward 2",
    description: "Desc 2",
    tokenCost: 5000,
    category: "Voucher",
    isAvailable: true,
    imageUrl: undefined,
    stock: 100,
    minTier: "SAPHIRE",
  },
  {
    id: "3",
    name: "Reward 3",
    description: "Desc 3",
    tokenCost: 500,
    category: "Experience",
    isAvailable: false,
    imageUrl: undefined,
    stock: 0,
    minTier: "SAPHIRE",
  },
]

describe('RewardsClient', () => {
  it('shows locked state when not eligible', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={false} userTier="SAPHIRE" token="mock" />)
    expect(screen.getByText('Redemption Locked')).toBeInTheDocument()
  })

  it('renders rewards correctly when eligible', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} userTier="SAPHIRE" token="mock" />)
    expect(screen.getByText('Reward 1')).toBeInTheDocument()
    expect(screen.getByText('Reward 2')).toBeInTheDocument()
    expect(screen.getByText('Reward 3')).toBeInTheDocument()
  })

  it('disables redeem button if not enough tokens or out of stock', () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} userTier="SAPHIRE" token="mock" />)
    
    // Reward 1 costs 1000, user has 4500 → enabled
    expect(screen.getByTestId('redeem-btn-1')).not.toBeDisabled()
    
    // Reward 2 costs 5000, user has 4500 → disabled
    expect(screen.getByTestId('redeem-btn-2')).toBeDisabled()
    
    // Reward 3 costs 500 but isAvailable = false → disabled
    expect(screen.getByTestId('redeem-btn-3')).toBeDisabled()
  })

  it('opens dialog and submits redemption', async () => {
    render(<RewardsClient rewards={mockRewards} userTokens={4500} isEligible={true} userTier="SAPHIRE" token="mock" />)
    
    fireEvent.click(screen.getByTestId('redeem-btn-1'))
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Redemption')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('confirm-redeem-btn'))
    
    // Success state
    await waitFor(() => {
      expect(screen.getByText('Permintaan Terkirim!')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByTestId('done-btn')).toBeInTheDocument()
  })
})
