/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        cyber: {
          dark: '#030712',
          surface: '#080D1A',
          card: '#0B132B',
          cardElevated: '#111C38',
          border: '#1E293B',
          borderGlow: '#06B6D4',
          neon: '#00F2FE',
          cyan: '#06B6D4',
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B',
          violet: '#8B5CF6',
          slate: '#94A3B8',
        },
        surface: {
          50: '#F8FAFC',
          100: '#080D1A',
          200: '#0F172A',
          300: '#1E293B',
          400: '#334155',
          500: '#475569',
          600: '#64748B',
          700: '#94A3B8',
          800: '#CBD5E1',
          900: '#F8FAFC',
        },
        brand: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.35)',
        'glow-crimson': '0 0 30px -5px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 30px -5px rgba(245, 158, 11, 0.35)',
        'cyber-card': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(1.05)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
