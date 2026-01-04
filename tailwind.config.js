/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'page-bg': '#111111',
        'card-bg': '#111111',
        'card-hover': '#141414',
        'text-main': '#ffffff',
        'text-muted': '#d6d6d6',
      },
      fontFamily: {
        manrope: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tight-2': '-0.02em',
      },
    },
  },
  plugins: [],
};
