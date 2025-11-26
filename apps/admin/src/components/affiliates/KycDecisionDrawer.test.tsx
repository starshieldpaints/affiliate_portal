'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KycDecisionDrawer } from './KycDecisionDrawer';

const patchMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    patch: (...args: any[]) => patchMock(...args)
  }
}));

const affiliate = {
  id: 'aff1',
  name: 'Test Affiliate',
  email: 'aff@test.com',
  status: 'active',
  kycStatus: 'pending',
  createdAt: new Date(),
  linksCount: 0,
  ordersCount: 0
};

describe('KycDecisionDrawer', () => {
  beforeEach(() => {
    patchMock.mockReset();
  });

  it('submits decision and closes', async () => {
    patchMock.mockResolvedValue({});
    const onClose = jest.fn();
    render(
      <KycDecisionDrawer open affiliate={affiliate} onClose={onClose} onSubmitted={jest.fn()} />
    );

    fireEvent.click(screen.getByDisplayValue('reject'));
    fireEvent.change(screen.getByPlaceholderText('Add reviewer notes'), {
      target: { value: 'noted' }
    });
    fireEvent.click(screen.getByText('Submit decision'));

    await waitFor(() => expect(patchMock).toHaveBeenCalledWith('/admin/affiliates/aff1/kyc', { decision: 'reject', note: 'noted' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
