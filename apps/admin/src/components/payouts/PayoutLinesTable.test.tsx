'use client';

import { render, screen } from '@testing-library/react';
import { PayoutLinesTable } from './PayoutLinesTable';

describe('PayoutLinesTable', () => {
  it('renders payout lines', () => {
    render(
      <PayoutLinesTable
        data={[
          { id: 'l1', affiliateId: 'aff1', amount: 10, currency: 'USD', status: 'paid', createdAt: new Date('2024-01-01') }
        ]}
      />
    );
    expect(screen.getByText('aff1')).toBeInTheDocument();
    expect(screen.getByText(/USD 10.00/)).toBeInTheDocument();
  });
});
