/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        airbnb: {
          DEFAULT: '#FF385C',
          hover: '#E00B41',
          light: '#FFF8F6',
          dark: '#D70466',
        },
        charcoal: {
          DEFAULT: '#222222',
          muted: '#484848',
        },
        meta: {
          DEFAULT: '#717171',
          light: '#B0B0B0',
        },
        surface: {
          white: '#FFFFFF',
          card: '#F7F7F7',
          border: '#EBEBEB',
          hover: '#F2F2F2',
        }
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      aspectRatio: {
        '20/19': '20 / 19',
        '4/3': '4 / 3',
      },
      boxShadow: {
        'pill': '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'pill-hover': '0 2px 4px rgba(0,0,0,0.18)',
        'airbnb': '0 6px 16px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
};
