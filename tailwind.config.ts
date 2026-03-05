import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: '#0e0e0f',
          surface: '#1a1a1c',
          border: '#2a2a2d',
          text: '#e8e6e3',
          'text-secondary': '#9a9a9d',
          accent: '#d4a853',
          'accent-hover': '#e0b965',
          error: '#e05252',
          success: '#4caf7d',
        }
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      }
    }
  },
  plugins: []
} satisfies Config
