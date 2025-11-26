'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from './page';

const loginMock = jest.fn();

jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    user: null,
    loading: false,
    error: null
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() })
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('shows validation errors on submit without input', async () => {
    render(<AdminLoginPage />);
    const submit = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('calls login with form values', async () => {
    loginMock.mockResolvedValue(undefined);
    render(<AdminLoginPage />);
    fireEvent.change(screen.getByPlaceholderText('you@starshield.io'), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'password123' }));
  });
});
