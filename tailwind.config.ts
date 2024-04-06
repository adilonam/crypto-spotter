import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Note the addition of the `app` directory.
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [`var(--font-sans)`, ...defaultTheme.fontFamily.sans],
      },
    },
  },
  // Add any other Tailwind configuration options here
};

export default config;
