'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const options = [
    { key: 'light' as const, label: 'Light', Icon: Sun, accent: 'text-amber-400' },
    { key: 'dark' as const, label: 'Dark', Icon: Moon, accent: 'text-sky-400' }
  ];

  return (
    <motion.div
      role="group"
      aria-label="Toggle theme"
      className="inline-flex w-full max-w-[11.5rem] items-center rounded-full border border-slate-300/70 bg-white/80 p-1 text-xs font-medium shadow-md backdrop-blur dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-100 sm:text-sm"
      whileHover={{ scale: 1.01 }}
    >
      {options.map(({ key, label, Icon, accent }) => {
        const active = key === (isDark ? 'dark' : 'light');
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 transition-all duration-200 sm:gap-2 sm:px-3',
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800/80 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', accent)} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
