'use client';
import { useState } from 'react';
import Link from 'next/link';

const faqItems = [
  { q: 'How do I claim a pixel?', a: 'Tap "Connect X" to sign in with your X account. Drag and zoom the mosaic canvas to find an unclaimed pixel inside the Coinbase logo. Tap it, optionally add a personal message, and confirm. Your profile photo appears on the canvas permanently.' },
  { q: 'Can I change my pixel after claiming?', a: 'No. Every pixel claim is permanent and non-transferable. Once claimed, your pixel belongs to your X account for as long as the mosaic exists.' },
  { q: 'How many pixels can I claim?', a: 'One X account = One pixel. This ensures the mosaic stays community-driven — every person gets exactly one unique spot in internet history.' },
  { q: 'Is this an official Coinbase product?', a: 'No. Coinbase Community Mosaic is an independent community art project created by @Zkfync. It is not affiliated with or endorsed by Coinbase, Inc.' },
  { q: 'What happens if I change my X profile?', a: 'Your pixel is an immutable snapshot of your profile at the time of claiming. It does not update if you change your X profile photo or username later.' },
  { q: 'How many pixels exist?', a: 'The Coinbase logo contains approximately 6,092 claimable pixels in a 100×100 grid forming the iconic "C" shape.' },
  { q: 'Can I delete my pixel?', a: 'No. Once claimed, your pixel becomes a permanent part of the mosaic. This immutability is what makes it a true community monument.' },
  { q: 'Is my data safe?', a: 'We only store your public X profile information (username, display name, profile photo URL) and your optional message. Authentication is handled securely through X OAuth — we never see your credentials.' },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#080b1a] text-white">
      <section className="pt-24 pb-16 px-4 max-w-lg mx-auto">
        <h1 className="text-white text-[26px] font-extrabold tracking-[-0.025em] text-center mb-1">
          Frequently Asked Questions
        </h1>
        <p className="text-white/30 text-xs text-center mb-10">Everything about the Coinbase Community Mosaic</p>

        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div key={i} className="glass-card overflow-hidden transition-all duration-300">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.01] transition-colors"
              >
                <span className="text-white text-[13px] font-medium pr-6 tracking-tight">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4">
                  <p className="text-white/35 text-[13px] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-white/08 text-[11px] mt-8 text-center italic leading-relaxed">
          Community art project inspired by Coinbase.<br />Not affiliated with Coinbase, Inc.
        </p>
      </section>

      <div className="text-center pb-16">
        <Link href="/" className="text-white/20 hover:text-white/40 text-xs transition-colors">← Back to Mosaic</Link>
      </div>
    </div>
  );
}
