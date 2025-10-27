import { PropsWithChildren } from 'react';
import { cn } from '../utils/cn';

type CardProps = PropsWithChildren<{
  className?: string;
  variant?: 'default' | 'subtle';
}>;

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-shadow duration-150',
        variant === 'default'
          ? 'border-slate-800 bg-slate-900/70 shadow-lg shadow-black/10'
          : 'border-slate-800/60 bg-slate-900/20',
        className
      )}
    >
      {children}
    </div>
  );
}
