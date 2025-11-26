'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductFormDrawer } from './ProductFormDrawer';

const postMock = jest.fn();
const patchMock = jest.fn();

jest.mock('../../lib/api', () => ({
  api: {
    post: (...args: any[]) => postMock(...args),
    patch: (...args: any[]) => patchMock(...args)
  }
}));

describe('ProductFormDrawer', () => {
  beforeEach(() => {
    postMock.mockReset();
    patchMock.mockReset();
  });

  it('validates required fields', async () => {
    render(<ProductFormDrawer open onClose={() => {}} />);
    fireEvent.click(screen.getByText('Save product'));
    await waitFor(() => expect(screen.getByText(/Name required/)).toBeInTheDocument());
  });

  it('submits create payload', async () => {
    postMock.mockResolvedValue({});
    render(<ProductFormDrawer open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Product name'), { target: { value: 'Prod' } });
    fireEvent.change(screen.getByPlaceholderText('SKU'), { target: { value: 'SKU1' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10.5' } });
    fireEvent.change(screen.getByPlaceholderText('USD'), { target: { value: 'USD' } });
    fireEvent.click(screen.getByText('Save product'));
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith('/admin/products', {
        name: 'Prod',
        sku: 'SKU1',
        price: 10.5,
        currency: 'USD',
        description: '',
        categoryId: '',
        isActive: true
      })
    );
  });
});
