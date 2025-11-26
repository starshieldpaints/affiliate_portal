'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { AffiliatesTable, AffiliateRow } from './AffiliatesTable';

const rows: AffiliateRow[] = [
  {
    id: '1',
    name: 'Alice',
    email: 'alice@example.com',
    status: 'active',
    kycStatus: 'pending',
    createdAt: new Date('2024-01-01'),
    linksCount: 3,
    ordersCount: 5
  }
];

describe('AffiliatesTable', () => {
  it('renders rows', () => {
    render(<AffiliatesTable data={rows} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = jest.fn();
    render(<AffiliatesTable data={rows} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).toHaveBeenCalledWith(rows[0]);
  });
});
