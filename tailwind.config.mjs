/** @type {import('tailwindcss').Config} */
export default {
  // PERFORMANCE OPTIMIZATION: More aggressive content scanning
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './public/**/*.{html,js}'
  ],
  // OPTIMIZED: Reduced safelist for critical classes only
  safelist: [
    // Theme switching essentials only
    'dark', 'light-mode-only', 'dark-mode-only',
    // Core typography (essential only)
    'apple-gradient-text', 'apple-headline',
    // Essential transitions
    'transition-colors', 'duration-300',
    // Critical dynamic classes
    'text-text-light-primary', 'text-text-dark-primary',
    'bg-light-primary', 'bg-dark-primary',
    // Modal states
    'opacity-0', 'invisible', 'scale-95', 'scale-100',
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
      // Native system fonts - fast, secure, and great looking
      fontFamily: {
        'sans': [
          '-apple-system',
          'BlinkMacSystemFont', 
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"', 
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        'serif': [
          'ui-serif',
          'Georgia', 
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif'
        ],
        'mono': [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'monospace'
        ]
      },
      colors: {
        primary: {
          blue: '#10d1ff',
          pink: '#ff4faa',
        },
        // Backward compatibility for admin panel
        'primary-blue': '#10d1ff',
        'primary-pink': '#ff4faa',
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
