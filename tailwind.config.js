/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        egypt: {
          dark: '#0a0b0e',
          card: '#12151c',
          cardBorder: '#272d3b',
          gold: '#d4af37',
          goldLight: '#f6e27a',
          goldDark: '#8c7018',
          sand: '#e8dcbe',
          curseRed: '#881337',
          curseGlow: '#e11d48',
          pharaonic: '#d4af37',
          roman: '#8b5cf6',
          islamic: '#10b981',
          modern: '#38bdf8',
        }
      },
      fontFamily: {
        arabic: ['var(--font-cairo)', 'Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      animation: {
        'curse-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

