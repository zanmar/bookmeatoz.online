// /var/www/bookmeatoz.online_ts/frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Default breakpoints are implicitly available.
    // You can customize them here if needed, or extend them.
    // Adding them explicitly for clarity or future customization:
    screens: {
      'xs': '475px',
      // => @media (min-width: 475px) { ... }

      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      // Your existing extensions:
      colors: {
        primary: {
          light: '#67e8f9', // Example: cyan-300
          DEFAULT: '#06b6d4', // Example: cyan-500
          dark: '#0e7490',  // Example: cyan-700
        },
        secondary: {
          light: '#f9a8d4', // Example: pink-300
          DEFAULT: '#ec4899', // Example: pink-500
          dark: '#be185d',  // Example: pink-700
        },
        accent: '#f59e0b', // Example: amber-500
        neutral: {
          lightest: '#f8fafc', // slate-50
          light: '#f1f5f9',   // slate-100
          DEFAULT: '#64748b', // slate-500
          dark: '#334155',    // slate-700
          darkest: '#0f172a', // slate-900
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: Using Inter font
        // mono: ['Roboto Mono', 'monospace'],
      },
      // You can also extend other theme properties responsively if needed,
      // but most responsiveness is done with utility prefixes in your components.
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // If you use forms and want default styling
    // require('@tailwindcss/typography'), // If you have prose content
    // require('@tailwindcss/aspect-ratio'), // For aspect ratio utilities
  ],
};
