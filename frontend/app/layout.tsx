import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://learnora-me.vercel.app'),
  title: {
    default: 'Learnora ME — Learn. Practise. Build. Prove.',
    template: '%s | Learnora ME',
  },
  description:
    'Connect structured learning with hands-on practice, real projects, feedback and evidence of the skills you can demonstrate.',
  applicationName: 'Learnora ME',
  openGraph: {
    type: 'website',
    siteName: 'Learnora ME',
    title: 'Learnora ME — Learn. Practise. Build. Prove.',
    description:
      'Connect learning with practice, projects, feedback and skills evidence.',
    url: 'https://learnora-me.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learnora ME — Learn. Practise. Build. Prove.',
    description:
      'Connect learning with practice, projects, feedback and skills evidence.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#090b0e',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
