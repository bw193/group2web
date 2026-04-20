import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // New design system
        cream: '#FAFAF7',
        sand: '#F2EEE8',
        'warm-gray': '#E5E0D8',
        'warm-border': '#DDD8D0',
        ink: {
          DEFAULT: '#1D1B18',
          mid: '#6B645B',
          light: '#9B9590',
        },
        bronze: {
          DEFAULT: '#9A8266',
          light: '#C4AD8F',
          subtle: '#EDE6DB',
        },
        espresso: {
          DEFAULT: '#2D2621',
          light: '#4A3F36',
        },
        // Legacy CMS colors (backward compat)
        primary: { bg: '#FFFFFF', 'bg-alt': '#F5F5F5' },
        secondary: { bg: '#EEEEEE', 'bg-alt': '#E8E8E8' },
        text: { primary: '#222222', secondary: '#666666' },
        accent: { gold: '#B8956A', 'gold-light': '#D4B896', navy: '#1B2A4A' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Outfit"', 'system-ui', 'sans-serif'],
        // Legacy
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
