/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#000000',
          secondary: '#111111',
          tertiary: '#1A1A1A',
        },
        accent: {
          yellow: '#FFC600',
          green: '#1DB954',
          red: '#FF4500',
        },
        glass: 'rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
  plugins: [],
} 