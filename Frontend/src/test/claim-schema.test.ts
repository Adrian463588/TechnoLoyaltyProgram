import { describe, it, expect } from 'vitest';
import { claimSchema } from '../components/forms/claim-form';

describe('Claim Form Zod Schema', () => {
  it('validates a correct payload', () => {
    const result = claimSchema.safeParse({
      division: 'OPCENT',
      date: '2026-10-10',
      amount: 5,
    });
    expect(result.success).toBe(true);
  });

  it('fails when division is missing', () => {
    const result = claimSchema.safeParse({
      date: '2026-10-10',
      amount: 5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Please select a division.');
    }
  });

  it('fails when amount is less than 1', () => {
    const result = claimSchema.safeParse({
      division: 'TECHNO',
      date: '2026-10-10',
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Amount must be at least 1');
    }
  });

  it('fails when date is empty', () => {
    const result = claimSchema.safeParse({
      division: 'TECHNO',
      date: '',
      amount: 5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Date is required');
    }
  });
});
