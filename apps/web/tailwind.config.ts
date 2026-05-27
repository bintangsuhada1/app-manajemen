import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#081A33',
        navy2: '#0E2A4D',
        gold: '#F5A524',
        soft: '#F5F7FA'
      },
      boxShadow: { premium: '0 22px 70px rgba(8, 26, 51, .16)' }
    }
  },
  plugins: []
};
export default config;
