/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Aleo', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: { 100: '#E0ECFF', 500: '#2563EB', 600: '#1E4ED8' },
        neutral: { 50: '#F8FAFC', 600: '#475569', 900: '#0F172A' },
        success: { 500: '#16A34A' },
        warning: { 500: '#D97706' },
      },
      borderRadius: {
        lg: '8px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'card-hover': '0 4px 8px 0 rgba(16, 24, 40, 0.08)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
