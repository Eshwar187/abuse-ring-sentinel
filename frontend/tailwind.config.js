/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      colors: {
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        brand: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#E11D48',
          600: '#BE123C',
          700: '#9F1239',
        },
        risk: {
          low: {
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            badge: '#10B981',
          },
          medium: {
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            badge: '#F59E0B',
          },
          high: {
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
            badge: '#EF4444',
          },
        }
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 1px rgba(0, 0, 0, 0.02)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        elevation: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
