/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#10d1ff',
          pink: '#ff4faa',
        },
        // Enhanced dark theme - much darker and richer
        dark: {
          primary: '#0a0b0d',      // Much darker base
          secondary: '#151619',     // Darker secondary
          tertiary: '#1f2024',     // Darker tertiary
          accent: '#2a2d31',       // For cards/components
        },
        // New light theme colors
        light: {
          primary: '#ffffff',      // Pure white base
          secondary: '#f8fafc',    // Very light gray
          tertiary: '#f1f5f9',     // Light gray
          accent: '#e2e8f0',       // For cards/components
        },
        // Text colors for each theme
        text: {
          'dark-primary': '#ffffff',
          'dark-secondary': 'rgba(255, 255, 255, 0.8)',
          'dark-tertiary': 'rgba(255, 255, 255, 0.6)',
          'light-primary': '#1e293b',
          'light-secondary': '#475569',
          'light-tertiary': '#64748b',
        },
        // Border colors for each theme
        border: {
          'dark': 'rgba(255, 255, 255, 0.1)',
          'dark-hover': 'rgba(255, 255, 255, 0.2)',
          'light': 'rgba(0, 0, 0, 0.1)',
          'light-hover': 'rgba(0, 0, 0, 0.2)',
        },
        chat: {
          green: '#10b981',
          emerald: '#059669',
          dark: '#047857',
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
        'subtle-shimmer': 'subtle-shimmer 4s ease-in-out infinite',
        'subtle-gradient-diffusion': 'subtle-gradient-diffusion 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'button-pulse': 'button-pulse 1.5s ease-in-out infinite',
        'green-gradient-flow': 'green-gradient-flow 3s ease-in-out infinite',
        'green-shimmer': 'green-shimmer 3s ease-in-out infinite',
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
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { transform: 'translateX(0%)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
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
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { transform: 'translateX(0%)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
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
