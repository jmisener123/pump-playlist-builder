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
        // Warm paper stock rather than clinical white
        paper: '#FBFAF8',
        // Single neutral ramp — everything structural is built from this
        ink: {
          50:  '#F5F4F1',
          100: '#EAE9E4',
          200: '#D7D5CE',
          300: '#B4B1A8',
          400: '#8A8780',
          500: '#5F5D58',
          600: '#44423E',
          700: '#2E2C2A',
          800: '#1F1E1C',
          900: '#141312',
          950: '#0B0A0A',
        },
        // The one accent. Used sparingly and deliberately.
        flare: {
          50:  '#FFF1ED',
          100: '#FFDFD6',
          200: '#FFBCA9',
          300: '#FF8F6B',
          400: '#FF6B47',
          500: '#E84421',
          600: '#C43314',
          700: '#9B2810',
          800: '#7A1F0C',
          900: '#571608',
          DEFAULT: '#E84421',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      borderRadius: {
        DEFAULT: '2px',
        md: '3px',
        lg: '4px',
      },
    },
  },
  plugins: [],
}
