/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f8',
          100: '#d9edef',
          200: '#b6dade',
          300: '#86bfc6',
          400: '#55a0aa',
          500: '#3a8590',
          600: '#2c6f7b',
          700: '#275b65',
          800: '#244c54',
          900: '#213f47',
          950: '#10272d',
        },
        surface: {
          DEFAULT: '#f1f5f7',
          muted: '#e8eef1',
        },
        slate: {
          850: '#172033',
          950: '#0a0f1d',
        }
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 39, 45, 0.04), 0 4px 16px -4px rgba(16, 39, 45, 0.06)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

