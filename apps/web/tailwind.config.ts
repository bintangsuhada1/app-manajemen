import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#071426',
        navy2: '#0B1730',
        gold: '#F59E0B',
        soft: '#F8FAFC'
      },
      boxShadow: { premium: '0 18px 44px rgba(15, 23, 42, .10)' }
    }
  },
  plugins: []
};
export default config;
