'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useAuthStore } from '../src/store/auth-store';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const initialize = useAuthStore((s) => s.initialize);

  const isAuthRoute = pathname.startsWith('/auth');

  useEffect(() => {
    if (!isAuthRoute) {
      initialize();
    }
  }, [isAuthRoute, initialize]);

  return null;
}
