'use client';
import { useState } from 'react';
import Link from 'next/link';

const categories = [
  {
    label: 'Getting Started',
    items: [
      { q: 'How do I claim a pixel?', a: 'Tap "Claim Pixel" to sign in with X. Drag and zoom the mosaic. Find an empty pixel inside the C logo, tap it, add a message, and confirm. Your profile photo appears permanently.' },
      { q: 'How many pixels can I claim?', a: 'One X account = One permanent pixel. This keeps the mosaic community-driven.' },
      { q: 'Can I explore without logging in?', a: 'Yes! You can drag, zoom, and explore the mosaic freely. You only need to connect X when claiming a pixel.' },
    ],
  },
  {
    label: 'Permanence',
    items: [
      { q: 'Can I change my pixel after claiming?', a: 'No. Every claim is permanent and non-transferable. Your pixel belongs to your X account forever.' },
      { q: 'Can I delete my pixel?', a: 'No. Once claimed, your pixel becomes an immutable part of the mosaic. This permanence is what makes it a true digital monument.' },
      { q: 'What if I change my X profile?', a: 'Your pixel is a snapshot of your profile at claim time. It does not update if you change your X photo or username later.' },
    ],
  },
  {
    label: 'About the Project',
    items: [
      { q: 'Is this official Coinbase?', a: 'No. This is an independent community art project created by @Zkfync. Not affiliated with Coinbase, Inc.' },
      { q: 'How many pixels exist?', a: 'The 100×100 grid contains ~5,544 claimable pixels forming the Coinbase C logo.' },
      { q: 'Is my data safe?', a: 'We only store your public X profile info. Authentication uses X OAuth — we never see your credentials.' },
    ],
  },
];

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#04070F] text-[#F0F4FF]">
      <section className="pt-24 pb-16 px-4 max-w-lg mx-auto">
        <h1 className="text-[26px] font-bold font-display tracking-[-0.03em] text-center mb-6 text-gradient">FAQ</h1>

        {categories.map(cat => (
          <div key={cat.label} className="mb-6">
            <div className="pill inline-block mb-3 bg-[#0052FF]/8 border border-[#0052FF]/20 text-[#0052FF]">{cat.label}</div>
            <div className="space-y-2">
              {cat.items.map(item => {
                const key = `${cat.label}-${item.q}`;
                return (
                  <div key={key} className="glass overflow-hidden transition-all duration-300">
                    <button onClick={() => setOpenKey(openKey === key ? null : key)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.01] transition-colors">
                      <span className="text-white text-[13px] font-medium pr-6">{item.q}</span>
                      <svg className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform duration-300 ${openKey === key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openKey === key && <div className="px-5 pb-4"><p className="text-white/35 text-[13px] leading-relaxed">{item.a}</p></div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-white/08 text-[11px] mt-8 text-center italic">Community art project inspired by Coinbase. Not affiliated with Coinbase, Inc.</p>
      </section>
      <div className="text-center pb-16"><Link href="/" className="text-white/20 hover:text-white/40 text-xs transition-colors">← Back to Mosaic</Link></div>
    </div>
  );
}
