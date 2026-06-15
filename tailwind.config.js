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
          50: '#f0e6ff',
          100: '#d1b3ff',
          200: '#b380ff',
          300: '#944dff',
          400: '#7a1aff',
          500: '#43009a',
          600: '#36007a',
          700: '#29005c',
          800: '#1c003e',
          900: '#0e0020',
        },
        surface: {
          50: '#f8f9fa',
          100: '#1e1e2e',
          200: '#181825',
          300: '#11111b',
          400: '#0a0a12',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
