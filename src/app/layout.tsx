import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mosaic — One Account. One Pixel. One Place in History.',
  description: 'Thousands of humans are building a permanent digital monument together. Claim your pixel. Become part of internet history.',
  openGraph: {
    title: 'Mosaic — One Account. One Pixel. One Place in History.',
    description: 'Claim your pixel. Become part of internet history.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover"/><meta name="theme-color" content="#030611"/></head>
      <body className="antialiased bg-[#030611] text-[#f0f3fa] min-h-screen">{children}</body>
    </html>
  );
}
