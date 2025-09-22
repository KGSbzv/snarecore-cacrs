/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111827', // gray-900
        card: '#1F2937',      // gray-800
        border: '#374151',    // gray-700
        primary: {
          DEFAULT: '#3B82F6', // blue-600
          hover: '#2563EB',   // blue-700
        },
        text: {
          DEFAULT: '#F9FAFB', // gray-100
          secondary: '#9CA3AF', // gray-400
        },
        success: '#10B981',    // green-500
        error: '#EF4444',      // red-500
        warning: '#F59E0B',    // yellow-500,
      },
      fontFamily: {
        'sans': ['ui-sans-serif', 'system-ui'],
        'mono': ['ui-monospace', 'SFMono-Regular'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.98)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          },
        },
      },
    },
  },
  plugins: [],
}