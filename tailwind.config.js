/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a34a',
          light: '#e6c883',
          dark: '#9f7a2c',
        },
        beige: {
          DEFAULT: '#f8f1e6',
          dark: '#ecdfc8',
        },
        ink: '#1f1514',
        muted: '#6f5d5b',
      },
      fontFamily: {
        'bodoni': ['Bodoni Moda', 'serif'],
        'playfair': ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}


