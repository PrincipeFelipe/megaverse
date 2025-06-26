/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f9ff',
          100: '#ccf3ff',
          200: '#99e7ff',
          300: '#66dbff',
          400: '#33cfff',
          500: '#0da6d2',
          600: '#0a85a8',
          700: '#08647e',
          800: '#054254',
          900: '#03212a',
          950: '#01080d',
        },
        secondary: {
          50: '#eaf6fc',
          100: '#d4edf9',
          200: '#a9dbf3',
          300: '#84cfee',
          400: '#5fc2e8',
          500: '#39b6e3',
          600: '#2e92b5',
          700: '#226d88',
          800: '#17495c',
          900: '#0b242e',
          950: '#040f13',
        },
        dark: {
          50: '#e9eaef',
          100: '#d2d6df',
          200: '#a5acbf',
          300: '#78839f',
          400: '#4b597f',
          500: '#3a456a',
          600: '#2e3754',
          700: '#232a43',
          800: '#1a1f32',
          900: '#0d1019',
          950: '#06080d',
        }
      },
      fontFamily: {
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};