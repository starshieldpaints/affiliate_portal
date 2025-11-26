'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefundModal } from './RefundModal';

const patchMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    patch: (...args: any[]) => patchMock(...args)
  }
}));

describe('RefundModal', () => {
  beforeEach(() => {
    patchMock.mockReset();
  });

  it('validates amount and reason', async () => {
    render(<RefundModal open orderId="o1" onClose={() => {}} />);
    fireEvent.click(screen.getByText('Refund'));
    await waitFor(() => expect(screen.getByText(/Amount must be positive/)).toBeInTheDocument());
  });

  it('submits refund request', async () => {
    patchMock.mockResolvedValue({});
    render(<RefundModal open orderId="o1" onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Reason for refund'), {
      target: { value: 'Duplicate' }
    });
    fireEvent.click(screen.getByText('Refund'));
    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/admin/orders/o1/refund', { amount: 5, reason: 'Duplicate' })
    );
  });
});
