'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

describe('ConfirmDeleteDialog', () => {
  it('calls confirm when delete clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<ConfirmDeleteDialog open name="Test" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls cancel when cancel clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<ConfirmDeleteDialog open name="Test" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
