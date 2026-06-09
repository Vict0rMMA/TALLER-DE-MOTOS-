import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          tertiary: 'var(--bg-hover)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
          input: 'var(--bg-input)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          primary: 'var(--accent)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          accent: 'var(--text-accent)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
          accent: 'var(--border-accent)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'accent-glow': 'var(--accent-glow)',
        'accent-strong': 'var(--accent-glow-strong)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        accent: 'var(--shadow-accent)',
      },
      backgroundImage: {
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-sidebar': 'var(--gradient-sidebar)',
        'gradient-page': 'var(--gradient-page)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        entrance: 'entrance 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        entrance: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(16,185,129,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(16,185,129,0.3)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
