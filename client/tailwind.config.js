/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          dark: '#0e2319',
          primary: '#14462c',
          accent: '#1e6f47',
          light: '#eaf4ee',
          gold: '#c99e46',
          pitch: '#d4b172',
          danger: '#be123c',
          surface: '#15241b'
        }
      }
    },
  },
  plugins: [],
}
