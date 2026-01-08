/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bj-gold': '#ffd700',
        'bj-green-dark': '#0d2818',
        'bj-green-light': '#1a472a',
        'bj-red': '#d32f2f',
      },
      animation: {
        'deal': 'dealCard 0.5s ease-out forwards',
        'pop': 'popIn 0.3s forwards',
        'pulse-slow': 'pulse 2s infinite',
        'glow': 'glow 2s infinite',
      },
      keyframes: {
        dealCard: {
          '0%': { opacity: '0', transform: 'translateY(-50px) scale(0.8) rotate(5deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1) rotate(0deg)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #ffd700' },
          '50%': { boxShadow: '0 0 20px #ffd700' },
        }
      }
    },
  },
  plugins: [
    import('tailwindcss-animate')
  ],
}
