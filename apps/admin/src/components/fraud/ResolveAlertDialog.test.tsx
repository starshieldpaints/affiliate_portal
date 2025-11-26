'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResolveAlertDialog } from './ResolveAlertDialog';

const patchMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    patch: (...args: any[]) => patchMock(...args)
  }
}));

describe('ResolveAlertDialog', () => {
  beforeEach(() => {
    patchMock.mockReset();
  });

  it('resolves alert and calls API', async () => {
    patchMock.mockResolvedValue({});
    const onResolved = jest.fn();
    render(<ResolveAlertDialog open alertId="fa1" onClose={() => {}} onResolved={onResolved} />);
    fireEvent.change(screen.getByPlaceholderText('Notes for resolution'), {
      target: { value: 'reviewed' }
    });
    fireEvent.click(screen.getByText('Resolve'));
    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/admin/fraud/alerts/fa1/resolve', { notes: 'reviewed' })
    );
  });
});
