'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportForm } from './ReportForm';

const postMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    post: (...args: any[]) => postMock(...args)
  }
}));

describe('ReportForm', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('validates required fields', async () => {
    render(<ReportForm open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request report' }));
    await waitFor(() => expect(screen.getByText(/Type required/)).toBeInTheDocument());
  });

  it('submits report request', async () => {
    postMock.mockResolvedValue({});
    render(<ReportForm open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('performance'), { target: { value: 'performance' } });
    fireEvent.change(screen.getByPlaceholderText('last_7_days'), { target: { value: 'last_7_days' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request report' }));
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/admin/reports', {
        type: 'performance',
        range: 'last_7_days',
        format: 'csv'
      })
    );
  });
});
