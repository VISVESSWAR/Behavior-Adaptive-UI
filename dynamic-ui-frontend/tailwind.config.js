module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'adaptive-primary': '#3b82f6',
        'adaptive-secondary': '#8b5cf6',
        'adaptive-success': '#10b981',
        'adaptive-danger': '#ef4444',
        'adaptive-warning': '#f59e0b',
      },
      fontFamily: {
        'adaptive-sans': ['Inter', 'sans-serif'],
        'adaptive-mono': ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
