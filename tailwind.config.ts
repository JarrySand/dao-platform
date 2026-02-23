import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/shared/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          bg: 'var(--color-bg-primary)',
          'block-bg': 'var(--color-bg-secondary)',
          'input-bg': 'var(--color-bg-tertiary)',
          'hover-bg': 'var(--color-bg-hover)',
          'active-bg': 'var(--color-bg-active)',
          heading: 'var(--color-text-primary)',
          text: 'var(--color-text-secondary)',
          link: 'var(--color-text-primary)',
          border: 'var(--color-border)',
          'border-hover': 'var(--color-border-hover)',
          primary: 'var(--color-primary)',
          danger: 'var(--color-danger)',
          success: 'var(--color-success)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
