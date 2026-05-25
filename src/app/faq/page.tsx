'use client';
import { useState } from 'react';
import Link from 'next/link';
// Premium Coinbase-inspired FAQ page

const faqItems = [
  { q: 'How do I claim a pixel?', a: 'Tap "Connect X" to sign in with your X account. Then drag and zoom the mosaic canvas to find an unclaimed pixel inside the Coinbase logo. Tap it, add a message, and confirm. Your profile photo appears on the canvas permanently.' },
  { q: 'Can I change my pixel after claiming?', a: 'No. Every pixel claim is permanent and non-transferable. Once claimed, your pixel belongs to your X account forever.' },
  { q: 'How many pixels can I claim?', a: 'One X account = One pixel. This keeps the mosaic truly community-driven — every person gets their own unique spot.' },
  { q: 'Is this an official Coinbase product?', a: 'No. Coinbase Community Mosaic is a community-built tribute. It is not affiliated with Coinbase, Inc. Created by @Zkfync.' },
  { q: 'What happens if I change my X profile?', a: 'Your pixel is linked to your X account at the time of claiming and does not update if you change your profile later. It is an immutable snapshot.' },
  { q: 'How many pixels are there?', a: 'The Coinbase logo contains ~6,092 claimable pixels in a 100×100 grid forming the iconic "C" shape.' },
  { q: 'Can I delete my pixel?', a: 'No. Once claimed, your pixel becomes part of the mosaic permanently. This immutability is what makes it a true community artifact.' },
  { q: 'Is my data safe?', a: 'We only store your public X profile info (username, display name, profile photo URL) and your optional message. Authentication is handled securely through X OAuth.' },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#080b1a] text-white">
      <section className="pt-20 pb-16 px-4 max-w-lg mx-auto">
        <h1 className="text-white text-[28px] font-bold tracking-[-0.02em] text-center mb-1">Frequently Asked Questions</h1>
        <p className="text-white/35 text-xs text-center mb-10">Everything about Coinbase Community Mosaic</p>

        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.01] transition-colors"
              >
                <span className="text-white text-[13px] font-medium pr-6">{item.q}</span>
                <svg className={`w-4 h-4 text-white/25 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 animate-fade-in">
                  <p className="text-white/40 text-[13px] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="text-center pb-16">
        <Link href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">← Back to Mosaic</Link>
      </div>
    </div>
  );
}
