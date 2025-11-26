'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommissionRuleForm } from './CommissionRuleForm';

const postMock = jest.fn();
const patchMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    post: (...args: any[]) => postMock(...args),
    patch: (...args: any[]) => patchMock(...args)
  }
}));

describe('CommissionRuleForm', () => {
  beforeEach(() => {
    postMock.mockReset();
    patchMock.mockReset();
  });

  it('validates required fields', async () => {
    render(<CommissionRuleForm open onClose={() => {}} />);
    fireEvent.click(screen.getByText('Save rule'));
    await waitFor(() => expect(screen.getByText(/Name required/)).toBeInTheDocument());
  });

  it('submits create payload', async () => {
    postMock.mockResolvedValue({});
    render(<CommissionRuleForm open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Rule name'), { target: { value: 'Rule A' } });
    fireEvent.change(screen.getByDisplayValue(/Percent/i), { target: { value: 'fixed' } });
    fireEvent.change(screen.getByPlaceholderText('10'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Save rule'));
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/admin/commission-rules', expect.objectContaining({ name: 'Rule A', type: 'fixed', rate: 5 }))
    );
  });
});
