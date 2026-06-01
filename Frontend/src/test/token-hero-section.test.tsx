import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TokenHeroSection } from '../components/dashboard/token-hero-section';

vi.mock('../components/dashboard/animated-token-count', () => ({
  AnimatedTokenCount: ({ value }: { value: number }) => <span data-testid="animated-count">{value}</span>
}));

describe('TokenHeroSection', () => {
  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <TokenHeroSection 
        tokenBalance={0} 
        tier="SAPHIRE" 
        eligibilityStatus={{ eligible: false }} 
        isLoading={true} 
      />
    );
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders the correct token balance', () => {
    render(
      <TokenHeroSection 
        tokenBalance={4200} 
        tier="EMERALD" 
        eligibilityStatus={{ eligible: true }} 
        isLoading={false} 
      />
    );
    expect(screen.getByText(/Your Total Balance/i)).toBeInTheDocument();
    expect(screen.getByTestId('animated-count')).toHaveTextContent('4200');
    expect(screen.getByRole('link', { name: /Redeem Reward Now/i })).toBeInTheDocument();
  });
});
