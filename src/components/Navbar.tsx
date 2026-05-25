'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar({ onConnectClick }: { onConnectClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Coinbase Mosaic</span>
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Mosaic</Link>
          <Link href="/about" className="text-white/60 hover:text-white text-sm font-medium transition-colors">About</Link>
          <Link href="/faq" className="text-white/60 hover:text-white text-sm font-medium transition-colors">FAQ</Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onConnectClick}
            className="bg-[#0052FF] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#0045d9] transition-all shadow-lg shadow-[#0052FF]/20"
          >
            Connect X
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white/60 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/5 px-6 py-4 space-y-3">
          <Link href="/" className="block text-white/60 hover:text-white text-sm py-2" onClick={() => setMobileOpen(false)}>Mosaic</Link>
          <Link href="/about" className="block text-white/60 hover:text-white text-sm py-2" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/faq" className="block text-white/60 hover:text-white text-sm py-2" onClick={() => setMobileOpen(false)}>FAQ</Link>
        </div>
      )}
    </nav>
  );
}
