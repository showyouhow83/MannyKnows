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
      // OPTIMIZED: Reduced animation set - removed unused animations  
      animation: {
        'gradient-shift': 'gradient-shift 20s ease infinite',
        'button-pulse': 'button-pulse 1.5s ease-in-out infinite',
        'button-gradient': 'button-gradient 6s ease-in-out infinite',
        'green-gradient-flow': 'green-gradient-flow 3s ease-in-out infinite',
        'emoji-sway': 'emoji-sway 1.5s ease-in-out infinite',
      },
      // OPTIMIZED: Reduced keyframes - removed unused animations
      keyframes: {
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'button-pulse': {
          '0%, 100%': { 'box-shadow': '0 10px 30px rgba(255, 79, 170, 0.4)' },
          '50%': { 'box-shadow': '0 10px 40px rgba(255, 79, 170, 0.6)' }
        },
        'button-gradient': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'green-gradient-flow': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'emoji-sway': {
          '0%, 100%': { 
            transform: 'translate(0.25rem, -50%) rotate(calc(-6deg * var(--sway-intensity, 1))) translateY(calc(0px * var(--sway-intensity, 1)))' 
          },
          '25%': { 
            transform: 'translate(0.25rem, -50%) rotate(calc(8deg * var(--sway-intensity, 1))) translateY(calc(-8px * var(--sway-intensity, 1)))' 
          },
          '50%': { 
            transform: 'translate(0.25rem, -50%) rotate(calc(-4deg * var(--sway-intensity, 1))) translateY(calc(-4px * var(--sway-intensity, 1)))' 
          },
          '75%': { 
            transform: 'translate(0.25rem, -50%) rotate(calc(6deg * var(--sway-intensity, 1))) translateY(calc(-12px * var(--sway-intensity, 1)))' 
          }
        }
      },
      backgroundSize: {
        '200': '200% 200%',
        '300': '300% 300%'
      }
    },
  },
  plugins: [],
  // PERFORMANCE OPTIMIZATION: Disable unused core plugins
  corePlugins: {
    container: false,
  },
  // PERFORMANCE OPTIMIZATION: Optimized safelist with only essential classes
  safelist: [
    'dark',
    // Essential animation classes for the new optimized system
    'animate',
    'animate-fadeIn',
    'animate-slideInUp',
    'animate-slideInDown', 
    'animate-slideInLeft',
    'animate-slideInRight',
    'animate-scaleIn',
    // Essential utility classes  
    'transition-colors',
    'duration-300',
    'sf-regular',
    'sf-medium', 
    'sf-semibold',
    'sf-bold',
    'apple-gradient-text',
    'apple-headline',
    // Hardware acceleration classes
    'will-change-transform',
    'will-change-opacity',
    'backface-hidden',
    'preserve-3d'
  ]
}
