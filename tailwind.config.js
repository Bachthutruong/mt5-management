/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0b10",
        surface: "rgba(255, 255, 255, 0.05)",
        primary: "#6366f1",
        secondary: "#06b6d4",
        accent: "#a855f7",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
