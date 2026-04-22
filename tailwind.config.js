/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // we force dark; theme is dark-only
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: '#292663',
          50:  '#eeedf6',
          100: '#d6d4e8',
          200: '#adaad1',
          300: '#8581ba',
          400: '#5c58a3',
          500: '#33308c',
          600: '#292663', // brand
          700: '#211f51',
          800: '#19173d',
          900: '#0f0e26',
          950: '#08071a',
        },
        paper: {
          DEFAULT: '#FAF8F3',
          muted:   '#EDE8DB',
          dim:     '#C9C3B2',
        },
        accent: {
          // used sparingly — pre-order chip, focus rings
          warm: '#E8B86B',
          green: '#6FB58A',
          red: '#D97A7A',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // dense-table readable at ~13px body
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'inset-row': 'inset 0 -1px 0 rgba(250, 248, 243, 0.06)',
      },
    },
  },
  plugins: [],
}
