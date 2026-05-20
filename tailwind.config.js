/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#e0e7ff',
          100: '#c7d2fe',
          200: '#a5b4fc',
          300: '#818cf8',
          400: '#6366f1',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          800: '#1e1b4b',
          900: '#312e81',
        },
        // ─── Surface: CSS-variable-driven so dark/light mode works ───
        surface: {
          900: 'var(--surface-900)',
          800: 'var(--surface-800)',
          750: 'var(--surface-750)',
          700: 'var(--surface-700)',
          600: 'var(--surface-600)',
          500: 'var(--surface-500)',
          400: 'var(--surface-400)',
          300: 'var(--surface-300)',
        },
        // ─── Muted text: also CSS-variable-driven ───
        muted: {
          400: 'var(--muted-400)',
          500: 'var(--muted-500)',
          600: 'var(--muted-600)',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          900: '#064e3b',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          900: '#451a03',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          900: '#450a0a',
        },
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow':      '0 0 20px rgba(79, 70, 229, 0.25)',
        'glow-sm':   '0 0 10px rgba(79, 70, 229, 0.15)',
        'card':      '0 1px 3px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(79, 70, 229, 0.2)',
        'modal':     '0 25px 50px rgba(0,0,0,0.35)',
      },
      textColor: {
        // Semantic text tokens that respond to theme
        'foreground':       'var(--text-foreground)',
        'foreground-muted': 'var(--text-muted)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
