import { Inter, DM_Serif_Display } from 'next/font/google';

export const googleSans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans', // This is for our CSS
});

export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif-display', // This is for our CSS
});
