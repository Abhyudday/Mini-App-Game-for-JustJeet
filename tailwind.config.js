/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crypto-green': '#00d4aa',
        'crypto-red': '#ff4757',
        'chart-bg': '#1a1a2e',
        'game-bg': '#16213e',
      },
      animation: {
        'bounce-game': 'bounce 0.3s ease-out',
        'chart-move': 'chartMove 2s linear infinite',
        'candle-glow': 'candleGlow 1s ease-in-out infinite alternate',
      },
      keyframes: {
        chartMove: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100px)' },
        },
        candleGlow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
