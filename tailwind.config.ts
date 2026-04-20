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
        // New design system — lighter, airier
        cream: '#FCFBF8',
        sand: '#F7F4EE',
        'warm-gray': '#EFEAE2',
        'warm-border': '#ECE7DF',
        ink: {
          DEFAULT: '#2A2620',
          mid: '#7A736A',
          light: '#B6B0A8',
        },
        bronze: {
          DEFAULT: '#A88E6F',
          light: '#CDB99A',
          subtle: '#F1ECE2',
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
