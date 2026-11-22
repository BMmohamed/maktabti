import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
        sham: {
          blue: '#1e40af',
          gold: '#d97706',
          bg: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
