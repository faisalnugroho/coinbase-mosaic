import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coinbase Community Mosaic Wall',
  description: 'Built by you. Forever onchain. Each pixel is an X user. Together we build the largest Coinbase community mosaic.',
  openGraph: {
    title: 'Coinbase Community Mosaic Wall',
    description: 'Built by you. Forever onchain. Claim your pixel now.',
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
          splashBackgroundColor: '#0a0a0a',
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://sdwtprdggwuqanbuaeww.supabase.co" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
