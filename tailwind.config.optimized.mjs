/** @type {import('tailwindcss').Config} */
export default {
  // PERFORMANCE OPTIMIZATION: Aggressive purging
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './public/**/*.{html,js}'
  ],
  // Add safelist for dynamic classes that might be missed
  safelist: [
    // Theme switching
    'dark',
    // Typography variants
    'sf-regular', 'sf-medium', 'sf-semibold', 'sf-bold',
    'apple-gradient-text', 'apple-headline', 'apple-body-text',
    // Essential animations
    'animate-float', 'animate-sparkle',
    // Transition classes
    'transition-colors', 'transition-all', 'duration-300',
    // Dynamic color classes (most commonly used)
    'text-text-light-primary', 'text-text-dark-primary',
    'text-text-light-secondary', 'text-text-dark-secondary',
    'bg-light-primary', 'bg-dark-primary',
    'bg-light-secondary', 'bg-dark-secondary',
    // Gradients (commonly used)
    'bg-gradient-to-r', 'bg-gradient-to-t',
    'from-primary-blue', 'to-primary-pink',
    'from-gray-50/50', 'to-gray-50/20',
    'dark:from-gray-900/60', 'dark:to-gray-900/30',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1111px',  // Custom breakpoint for navigation switch
      '2xl': '1536px',
    },
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
          primary: '#fafafa',      // Light gray base
          secondary: '#f4f4f5',    // Slightly darker light
          tertiary: '#e4e4e7',     // Border/divider color
          accent: '#ffffff',       // Pure white for cards
        },
        // Text colors for better contrast
        text: {
          'light-primary': '#18181b',    // Dark text on light bg
          'light-secondary': '#71717a',   // Muted text on light bg
          'dark-primary': '#fafafa',      // Light text on dark bg
          'dark-secondary': '#a1a1aa',    // Muted text on dark bg
        },
      },
      spacing: {
        '1.75': '0.45rem',  // Custom padding for chat elements
        '2.25': '0.55rem',  // Custom padding for smaller elements
      },
      maxWidth: {
        'chat': '85%',      // Custom max-width for chat bubbles
        'chat-sm': '80%',   // Alternative chat bubble width
      },
      // OPTIMIZED: Essential animations only
      animation: {
        'gradient-shift': 'gradient-shift 20s ease infinite',
        'emoji-sway': 'emoji-sway 1.5s ease-in-out infinite',
      },
      // OPTIMIZED: Essential keyframes only
      keyframes: {
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'emoji-sway': {
          '0%, 100%': { 
            transform: 'translate(0.25rem, -50%) rotate(-6deg)' 
          },
          '50%': { 
            transform: 'translate(0.25rem, -50%) rotate(6deg)' 
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
}
