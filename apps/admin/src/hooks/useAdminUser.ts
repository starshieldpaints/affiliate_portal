import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useAdminUser() {
  const { user, refreshToken, loading } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      refreshToken();
    }
  }, [user, loading, refreshToken]);

  return { user, refreshToken, loading };
}
