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
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
    expect(screen.getByText('Purchase')).toBeInTheDocument();
    expect(screen.getByText('Pickup')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders in compact mode without labels', () => {
    render(<RedemptionPipeline currentStep="submitted" compact />);
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('reflects verified step correctly', () => {
    const { container } = render(<RedemptionPipeline currentStep="verified" />);
    // The "Verify" label should exist
    expect(screen.getByText('Verify')).toBeInTheDocument();
    // Should render at least one CheckCircle2 (completed step)
    expect(container.querySelectorAll('[class*="animate-success-pop"]').length).toBeGreaterThan(0);
  });

  it('reflects completed state', () => {
    render(<RedemptionPipeline currentStep="completed" />);
    // All labels present
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
