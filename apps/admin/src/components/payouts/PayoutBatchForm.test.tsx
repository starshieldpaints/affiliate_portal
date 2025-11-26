'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayoutBatchForm } from './PayoutBatchForm';

const postMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    post: (...args: any[]) => postMock(...args)
  }
}));

describe('PayoutBatchForm', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('submits batch payload', async () => {
    postMock.mockResolvedValue({});
    render(<PayoutBatchForm open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('aff1, aff2'), {
      target: { value: 'a1,a2' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create batch' }));
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/admin/payouts/batch', {
        affiliateIds: ['a1', 'a2'],
        scheduledFor: ''
      })
    );
  });
});
