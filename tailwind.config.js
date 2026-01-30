/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        secondary: '#4ecdc4',
        accent: '#ff6b6b',
      },
      backgroundImage: {
        'gradient-header': 'linear-gradient(135deg, #667eea, #4ecdc4)',
        'gradient-step1': 'linear-gradient(135deg, #ffecd2, #ff6b6b)',
      },
    },
  },
  plugins: [],
}
