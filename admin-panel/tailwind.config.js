/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF0FF',
          100: '#D6E0FF',
          200: '#ADC1FF',
          300: '#85A3FF',
          400: '#5C84FF',
          500: '#102C7E',
          600: '#0D2366',
          700: '#0A1B4D',
          800: '#061233',
          900: '#030A1A',
        },
        syndicate: {
          gold: '#C5A55A',
          navy: '#102C7E',
          dark: '#0A0A0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
