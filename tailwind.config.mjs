/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#10d1ff',
          pink: '#ff4faa',
        },
        dark: {
          primary: '#1b1c1e',
          secondary: '#2a2d31',
          tertiary: '#373b3f',
        },
        chat: {
          green: '#10b981',
          emerald: '#059669',
          dark: '#047857',
        },
        podcast: {
          purple: '#8b5cf6',
          violet: '#7c3aed',
          dark: '#6d28d9',
        }
      },
      spacing: {
        '1.75': '0.45rem',  // Custom padding for chat elements
        '2.25': '0.55rem',  // Custom padding for smaller elements
      },
      maxWidth: {
        'chat': '85%',      // Custom max-width for chat bubbles
        'chat-sm': '80%',   // Alternative chat bubble width
      },
      animation: {
        'gradient-shift': 'gradient-shift 20s ease infinite',
        'simple-gradient-flow': 'simple-gradient-flow 6s ease-in-out infinite',
        'subtle-shimmer': 'subtle-shimmer 20s infinite',
        'subtle-gradient-diffusion': 'subtle-gradient-diffusion 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'button-pulse': 'button-pulse 1.5s ease-in-out infinite',
        'green-gradient-flow': 'green-gradient-flow 3s ease-in-out infinite',
        'green-shimmer': 'green-shimmer 2s ease-in-out infinite',
        'podcast-gradient-flow': 'podcast-gradient-flow 3s ease-in-out infinite',
        'podcast-shimmer': 'podcast-shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'simple-gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'subtle-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'subtle-gradient-diffusion': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 8px 25px rgba(16, 209, 255, 0.4)' },
          '50%': { 'box-shadow': '0 8px 35px rgba(16, 209, 255, 0.6)' }
        },
        'button-pulse': {
          '0%, 100%': { 'box-shadow': '0 10px 30px rgba(255, 79, 170, 0.4)' },
          '50%': { 'box-shadow': '0 10px 40px rgba(255, 79, 170, 0.6)' }
        },
        'green-gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'green-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'podcast-gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'podcast-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      backgroundSize: {
        '200': '200% 200%',
        '300': '300% 300%'
      }
    },
  },
  plugins: [],
}
