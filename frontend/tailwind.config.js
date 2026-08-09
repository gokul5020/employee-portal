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
          50: '#f0f4ff',
          100: '#e1e9ff',
          200: '#c7d7ff',
          300: '#9db8ff',
          400: '#6b8eff',
          500: '#3b5eff',
          600: '#253eff',
          700: '#1d2ee6',
          800: '#1725be',
          900: '#182496',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
