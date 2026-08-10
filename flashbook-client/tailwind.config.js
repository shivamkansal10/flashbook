/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#FAFAFA',
        foreground: '#111111',
        primary: {
          DEFAULT: '#111111',
          foreground: '#FAFAFA',
          hover: '#222222',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF',
          hover: '#EA580C',
          light: '#FFEDD5',
        },
        secondary: {
          DEFAULT: '#F4F4F5',
          foreground: '#18181B',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F4F4F5',
          foreground: '#71717A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
      },
      borderRadius: {
        'none': '0px',
        'sm': '0.375rem',
        'DEFAULT': '0.75rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
