/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable manual theme toggling
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#FFC700',
          dark: '#111111', // Tweaked to match Sidebar darker tone
          accent: '#E63946',
        }
      }
    },
  },
  plugins: [],
}