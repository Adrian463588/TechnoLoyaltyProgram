import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RedemptionPipeline } from '@/components/shared/redemption-pipeline';

describe('RedemptionPipeline', () => {
  it('renders without crashing', () => {
    render(<RedemptionPipeline currentStep="submitted" />);
    expect(screen.getByTestId('redemption-pipeline')).toBeInTheDocument();
  });

  it('shows step labels in full mode', () => {
    render(<RedemptionPipeline currentStep="submitted" />);
    expect(screen.getByText('Request Sent')).toBeInTheDocument();
    expect(screen.getByText('Document Review')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('renders in compact mode without labels', () => {
    render(<RedemptionPipeline currentStep="submitted" compact />);
    expect(screen.queryByText('Request Sent')).not.toBeInTheDocument();
  });

  it('reflects reviewed step correctly', () => {
    const { container } = render(<RedemptionPipeline currentStep="review" />);
    // The "Document Review" label should exist
    expect(screen.getByText('Document Review')).toBeInTheDocument();
    // Should render at least one CheckCircle2 (completed step)
    expect(container.querySelectorAll('[class*="animate-success-pop"]').length).toBeGreaterThan(0);
  });

  it('reflects accepted state', () => {
    render(<RedemptionPipeline currentStep="accepted" />);
    // All labels present
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });
});
