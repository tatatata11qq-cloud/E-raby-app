/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Emerald primary
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Gold / Amber accent for i'rab & achievements
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Noto Sans Arabic', 'sans-serif'],
        heading: ['IBM Plex Sans Arabic', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
        brand: ['El Messiri', 'Amiri', 'serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(6, 78, 59, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft': '0 8px 24px -4px rgba(6, 78, 59, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 16px 36px -6px rgba(6, 78, 59, 0.12), 0 8px 20px -4px rgba(0, 0, 0, 0.05)',
        'emerald-glow': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
