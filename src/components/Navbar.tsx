'use client';
// Rebuilt 1:1 from uploaded image

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ onConnectClick }: { onConnectClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Mosaic' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-[#0a0a0a] border-b border-[#1a1a2e]">
      <div className="max-w-[1600px] mx-auto px-5 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-[34px] h-[34px] rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-lg leading-none">
            C
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-semibold text-[15px] tracking-tight">coinbase</span>
            <span className="text-[#8a8a8a] text-[10px] tracking-[0.15em] font-medium">MOSAIC</span>
          </div>
        </Link>

        {/* Center: Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-white' : 'text-[#8a8a8a] hover:text-white'
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#0052FF] rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dark/Light toggle */}
          <button className="w-9 h-9 flex items-center justify-center text-[#8a8a8a] hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </button>

          {/* Connect X button */}
          <button
            onClick={onConnectClick}
            className="bg-[#0052FF] text-white text-[13px] font-medium px-4 h-[34px] rounded-full hover:bg-[#0045d9] transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,82,255,0.25)]"
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Connect X
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[#8a8a8a] hover:text-white ml-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden bg-[#0a0a0a] border-t border-[#1a1a2e] px-5 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2.5 text-sm rounded-lg ${
                pathname === link.href
                  ? 'text-white bg-white/[0.04]'
                  : 'text-[#8a8a8a] hover:text-white hover:bg-white/[0.02]'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
