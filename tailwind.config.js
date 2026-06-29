/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Command-center dark palette
        base: {
          900: '#0a0a0b', // app background
          800: '#121214', // raised surface
          700: '#1a1a1d', // card
          600: '#242428', // card hover / borders
          500: '#34343a',
        },
        accent: {
          DEFAULT: '#3b82f6',
          muted: '#1e3a8a',
        },
        good: '#22c55e',
        warn: '#f59e0b',
        bad: '#ef4444',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
