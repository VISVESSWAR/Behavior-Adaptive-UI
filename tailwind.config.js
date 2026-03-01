/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          light: "#dbeafe",
          DEFAULT: "#3b82f6",
          dark: "#1d4ed8",
        },
        success: {
          light: "#d1fae5",
          DEFAULT: "#10b981",
          dark: "#059669",
        },
        warning: {
          light: "#fef3c7",
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        },
        danger: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#dc2626",
        },
      },
      spacing: {
        safe: "1rem",
        medium: "1.5rem",
        generous: "2rem",
      },
    },
  },
  plugins: [],
};
