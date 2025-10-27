import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          dark: '#b91c1c',
          light: '#fee2e2'
        },
        surface: {
          DEFAULT: '#0b1120',
          muted: '#1f2937',
          subtle: '#111827'
        }
      },
      fontFamily: {
        sans: ['"InterVariable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};

export default config;
