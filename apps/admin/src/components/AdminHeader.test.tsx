'use client';

import { render, screen, fireEvent } from '@testing-library/react';
import { AdminHeader } from './AdminHeader';

const logoutMock = jest.fn();
const replaceMock = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'admin@example.com' },
    logout: logoutMock,
    loading: false
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock })
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    logoutMock.mockClear();
    replaceMock.mockClear();
  });

  it('renders title and user email', () => {
    render(<AdminHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('calls logout and redirects', async () => {
    logoutMock.mockResolvedValue(undefined);
    render(<AdminHeader title="Dashboard" />);
    fireEvent.click(screen.getByText('Logout'));
    expect(logoutMock).toHaveBeenCalled();
    // allow promise resolution
    await Promise.resolve();
    expect(replaceMock).toHaveBeenCalledWith('/auth/login');
  });
});
