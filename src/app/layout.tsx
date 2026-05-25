import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coinbase Community Mosaic',
  description: 'One account. One pixel. Forever. Join thousands building the internet\'s most permanent community monument.',
  openGraph: {
    title: 'Coinbase Community Mosaic — One Account. One Pixel. Forever.',
    description: 'Join thousands building the internet\'s most permanent community monument.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: '/og-image.png',
      button: { title: 'Claim Pixel', action: { type: 'launch_frame', name: 'Coinbase Mosaic', splashImageUrl: '/icon.png', splashBackgroundColor: '#04070F' } },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#04070F" />
        <link rel="preconnect" href="https://sdwtprdggwuqanbuaeww.supabase.co" />
      </head>
      <body className="antialiased bg-[#04070F] text-[#F0F4FF] min-h-screen">
        {children}
      </body>
    </html>
  );
}
