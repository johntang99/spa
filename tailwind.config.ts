import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variables for theme customization
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
          light: 'var(--secondary-light)',
          50: 'var(--secondary-50)',
        },
        backdrop: {
          primary: 'var(--backdrop-primary)',
          secondary: 'var(--backdrop-secondary)',
        },
      },
      fontSize: {
        'display': 'var(--text-display)',
        'heading': 'var(--text-heading)',
        'subheading': 'var(--text-subheading)',
        'body': 'var(--text-body)',
        'small': 'var(--text-small)',
      },
    },
  },
  plugins: [],
}

export default config
