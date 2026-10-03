/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fbf8f2',
          100: '#f5eee0',
          200: '#ebdcbf',
          300: '#dec498',
          400: '#d0a76f',
          500: '#b8863f',
          600: '#a37133',
          700: '#83572a',
          800: '#6c4627',
          900: '#5a3b23',
        },
        navy: {
          800: '#0f172a',
          900: '#0b1120',
          950: '#060a12',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}

