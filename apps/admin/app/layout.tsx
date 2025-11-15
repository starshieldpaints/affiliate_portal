import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { cn } from '../src/utils/cn';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'StarShield Admin Console',
  description: 'Operational control center for StarShield affiliate program.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          'min-h-screen bg-white text-slate-900 transition-colors dark:bg-surface dark:text-slate-100'
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
