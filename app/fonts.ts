// app/fonts.ts
import { Inter, Cormorant_Garamond } from 'next/font/google';

export const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-serif',
  display: 'swap',
});
