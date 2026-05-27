import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'PT Jurti Agung Mulia | Kontraktor Kelistrikan',
  description: 'Company profile dan dashboard manajemen PT Jurti Agung Mulia.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
