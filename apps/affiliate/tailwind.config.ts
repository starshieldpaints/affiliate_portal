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
        palette: {
          black: '#05060a',
          white: '#f8fafc',
          blue: '#38bdf8',
          green: '#10b981',
          red: '#ef4444'
        },
        surface: {
          DEFAULT: '#0f172a',
          muted: '#1e293b',
          subtle: '#111827'
        }
      },
      fontFamily: {
        sans: ['"InterVariable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      boxShadow: {
        accent: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};

export default config;
