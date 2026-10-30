/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for DukaanMate brand
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Main orange - warm and friendly
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
      },
      // Large readable font sizes for non-technical shopkeeper users
      fontSize: {
        'shop': ['1.125rem', { lineHeight: '1.75rem' }], // 18px - base for this app
      },
      fontFamily: {
        // Noto Sans covers Devanagari (Hindi) and Gurmukhi (Punjabi) Unicode
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gurmukhi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Minimum 44px tap targets for mobile accessibility
      minHeight: {
        'tap': '44px',
      },
      minWidth: {
        'tap': '44px',
      },
    },
  },
  plugins: [],
}

