import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable static export for Vercel
  output: 'standalone',
  
  // Image domains for external profile pictures
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Farcaster manifest redirect
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/farcaster.json',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
