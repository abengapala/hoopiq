/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#080B10',
        bg2:     '#0D1117',
        bg3:     '#131A22',
        bg4:     '#1A2333',
        bg5:     '#202D40',
        accent:  '#F5A623',
        accent2: '#FF6B2B',
        green:   '#10D98A',
        red:     '#FF4757',
        blue:    '#4A90E2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
