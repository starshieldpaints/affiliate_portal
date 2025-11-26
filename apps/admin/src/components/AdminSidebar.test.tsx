'use client';

import { render, screen } from '@testing-library/react';
import { AdminSidebar } from './AdminSidebar';

jest.mock('next/navigation', () => ({
    usePathname: () => '/orders'
  }));

describe('AdminSidebar', () => {
  it('highlights active route', () => {
    render(<AdminSidebar />);
    const ordersLink = screen.getByText('Orders');
    expect(ordersLink.className).toMatch(/bg-slate-900|text-white/);
  });
});
