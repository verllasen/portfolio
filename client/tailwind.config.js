/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505", // Very dark bg
        surface: "#121212",    // Slightly lighter
        surfaceHighlight: "#1E1E1E",
        primary: "#00E5FF",    // Cyan Neon
        secondary: "#7C3AED",  // Deep Purple
        accent: "#F43F5E",     // Pink Neon
        success: "#10B981",    // Emerald
        warning: "#F59E0B",    // Amber
        error: "#EF4444",      // Red
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1f1f1f 1px, transparent 1px), linear-gradient(to bottom, #1f1f1f 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
