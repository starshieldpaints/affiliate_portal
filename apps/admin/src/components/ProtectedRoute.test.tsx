'use client';

import { render } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock })
}));

jest.mock('../context/AuthContext', () => {
  return {
    useAuth: jest.fn(() => ({ user: null, loading: false }))
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('redirects to login when no user', () => {
    render(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>
    );
    expect(replaceMock).toHaveBeenCalledWith('/auth/login');
  });

  it('renders children when user exists', () => {
    const useAuth = require('../context/AuthContext').useAuth as jest.Mock;
    useAuth.mockReturnValue({ user: { id: '1' }, loading: false });
    const { getByText } = render(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>
    );
    expect(getByText('secret')).toBeInTheDocument();
  });
});
