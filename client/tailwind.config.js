/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F5F0',
        text: '#14213D',
        primary: '#0F766E',
        border: '#E3DFD5',
        status: {
          not_started: '#8A8F98',
          not_started_bg: '#F3F4F6',
          in_review: '#B7791F',
          in_review_bg: '#FEFCBF',
          query_raised: '#2B6CB0',
          query_raised_bg: '#EBF8FF',
          approved: '#2F855A',
          approved_bg: '#C6F6D5',
          rejected: '#C53030',
          rejected_bg: '#FED7D7',
          overdue: '#C53030',
          overdue_bg: '#FED7D7'
        }
      },
      fontFamily: {
        headings: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        card: 'none',
      }
    },
  },
  plugins: [],
}
