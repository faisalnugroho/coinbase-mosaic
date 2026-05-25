import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coinbase Community Mosaic Wall',
  description: 'Claim your pixel on the Coinbase Community Mosaic. One pixel per person, forever. Built by the community, for the community.',
  openGraph: {
    title: 'Coinbase Community Mosaic Wall',
    description: 'Claim your pixel on the Coinbase Community Mosaic Wall 🟦',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: '/og-image.png',
      button: {
        title: '🟦 Claim Pixel',
        action: {
          type: 'launch_frame',
          name: 'Coinbase Mosaic',
          splashImageUrl: '/icon.png',
          splashBackgroundColor: '#0052FF',
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://sdwtprdggwuqanbuaeww.supabase.co" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
