/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'eeg-blue': {
          50: '#e6f1ff',
          100: '#b3d9ff',
          200: '#80c1ff',
          300: '#4da9ff',
          400: '#1a91ff',
          500: '#0079e6',
          600: '#0061b3',
          700: '#004980',
          800: '#00314d',
          900: '#00191a',
          electric: '#0079e6', // Alias for eeg-blue-500
        },
        'eeg-charcoal': '#2c3e50',
        'eeg-silver': '#c0c0c0',
        'eeg-steel': '#708090',
        // Executive Elite Design System tokens
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#1e3a8a',
          600: '#1e40af',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

