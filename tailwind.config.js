/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#0EA5E9',
        success: '#22C55E',
        warning: '#F59E0B',
        critical: '#EF4444',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        ink: '#0F172A',
        'dark-bg': '#0F172A',
        'dark-card': '#1E293B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        glass: '0 8px 32px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
