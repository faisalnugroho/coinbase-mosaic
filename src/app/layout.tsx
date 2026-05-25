import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coinbase Community Mosaic',
  description: 'One account. One pixel. Forever. Together we build the world\'s largest Coinbase community mosaic.',
  openGraph: {
    title: 'Coinbase Community Mosaic',
    description: 'One account. One pixel. Forever. Claim your pixel now.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: '/og-image.png',
      button: {
        title: 'Claim Pixel',
        action: {
          type: 'launch_frame',
          name: 'Coinbase Mosaic',
          splashImageUrl: '/icon.png',
          splashBackgroundColor: '#080b1a',
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#080b1a" />
        <link rel="preconnect" href="https://sdwtprdggwuqanbuaeww.supabase.co" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-[#080b1a] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
