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

  it('renders the correct token balance and tier', () => {
    render(
      <TokenHeroSection 
        tokenBalance={4200} 
        tier="EMERALD" 
        eligibilityStatus={{ eligible: true }} 
        isLoading={false} 
      />
    );
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByTestId('animated-count')).toHaveTextContent('4200');
    expect(screen.getByText('EMERALD')).toBeInTheDocument();
  });

  it('renders the correct eligibility chip when eligible', () => {
    render(
      <TokenHeroSection 
        tokenBalance={4200} 
        tier="EMERALD" 
        eligibilityStatus={{ eligible: true }} 
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Eligible for Redemption');
  });

  it('renders the correct eligibility chip when not eligible', () => {
    render(
      <TokenHeroSection 
        tokenBalance={100} 
        tier="SAPHIRE" 
        eligibilityStatus={{ eligible: false, reason: 'Insufficient balance' }} 
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Not eligible — Insufficient balance');
  });
});
