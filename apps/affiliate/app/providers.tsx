'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useAuthStore } from '../src/store/auth-store';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initialize().finally(() => setInitialized(true));
    }
  }, [initialize, initialized]);

  return null;
}
