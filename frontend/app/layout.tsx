import './globals.css';

import {
  DM_Serif_Display,
  JetBrains_Mono,
  Manrope,
} from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: '400',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'Learnora ME | Learn Skills. Build Your Future.',
  description:
    'Learnora ME is a practical learning platform for data, technology, business, web development, data science and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${dmSerifDisplay.variable} ${jetBrainsMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}