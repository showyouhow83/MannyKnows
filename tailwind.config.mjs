/** @type {import('tailwindcss').Config} */
export default {
  // Content globs are a deliberate ALLOWLIST, not src/**. Two whole trees are
  // excluded on purpose:
  //  - src/pages/admin, src/pages/partners, and the customer-portal pages
  //    (quote/, project/, confirm/, my-project) style themselves with
  //    admin.css / portal.css — NOT Tailwind (see CLAUDE.md). Scanning their
  //    ~30 ported files generated utilities the public site never loads.
  //  - public/ held minified vendor JS (swiper-bundle et al.) whose token soup
  //    the scanner happily turned into CSS. Nothing in public/ uses Tailwind.
  // Measured effect of this allowlist: the public CSS bundle went from 113 KB
  // to a fraction of that. If you add a NEW public page directory, add it here
  // or its classes won't be generated.
  content: [
    './src/layouts/**/*.astro',
    './src/components/**/*.{astro,ts,js}',
    './src/pages/*.astro',
    './src/pages/{blog,work,plans,preview}/**/*.astro',
    './src/content/**/*.{md,mdx}',
    './src/data/**/*.ts',
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
          blue: '#0071e3',
          pink: '#ff4faa',
        },
        // Backward compatibility for admin panel
        'primary-blue': '#0071e3',
        'primary-pink': '#ff4faa',
        // Enhanced dark theme - much darker and richer
        dark: {
          primary: '#0a0a14',      // The canvas — near-black navy (design language, Aug 2026)
          secondary: '#12121f',     // Canvas-family surface (modals, dropdowns, cards)
          tertiary: '#1a1a2e',     // Canvas-family tertiary
          accent: '#262640',       // Canvas-family borders/components
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
          'light-secondary': '#18181b',   // Light mode: body text reads black (Manny, Aug 2026); titles keep their colors
          'dark-primary': '#fafafa',      // Light text on dark bg
          'dark-secondary': '#ffffff',    // Body text on dark bg — white test (all grays to white, Manny Aug 13 2026)
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
