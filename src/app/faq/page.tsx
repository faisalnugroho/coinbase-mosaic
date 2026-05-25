'use client';
// Rebuilt 1:1 from uploaded image

import { useState } from 'react';
import Link from 'next/link';

const faqItems = [
  {
    q: 'How do I claim a pixel?',
    a: 'Click "Connect X" to sign in with your X (Twitter) account. Then drag and zoom the mosaic canvas to find an unclaimed pixel inside the Coinbase logo. Click it, add an optional message, and confirm. Your profile photo will appear on the canvas permanently.',
  },
  {
    q: 'Can I change my pixel after claiming?',
    a: 'No. Every pixel claim is permanent and non-transferable. Once you claim a pixel, it belongs to your X account forever. Choose wisely!',
  },
  {
    q: 'How many pixels can I claim?',
    a: 'One X account = One pixel. This ensures every person gets their own unique spot and keeps the mosaic truly community-driven.',
  },
  {
    q: 'Is this an official Coinbase product?',
    a: 'No, Coinbase Community Mosaic is a community-built project. It is not affiliated with or endorsed by Coinbase, Inc. It was created by @Zkfync as a tribute to the Coinbase community.',
  },
  {
    q: 'What happens to my pixel if I change my X profile?',
    a: 'Your pixel is linked to your X account at the time of claiming. It is permanent and does not change if you update your X profile photo or username later.',
  },
  {
    q: 'How many pixels are there total?',
    a: 'The Coinbase logo contains approximately 6,092 claimable pixels. Each one represents a unique spot in the 100×100 grid that forms the iconic "C" shape.',
  },
  {
    q: 'Can I delete or remove my pixel?',
    a: 'No. Once claimed, your pixel becomes part of the mosaic permanently. This immutability is what makes the mosaic a true community artifact.',
  },
  {
    q: 'Is my data safe? What do you store?',
    a: 'We only store your public X profile information (username, display name, profile photo URL) and the message you choose to include. We do not have access to your X account credentials — authentication is handled securely through X OAuth.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-[60px]">
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white text-[36px] font-bold tracking-[-0.02em] text-center mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-[#8a8a8a] text-[14px] text-center mb-12">
            Everything you need to know about Coinbase Community Mosaic
          </p>

          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="bg-[#111111] border border-[#1a1a2e] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.01] transition-colors"
                >
                  <span className="text-white text-[14px] font-medium pr-8">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-[#8a8a8a] flex-shrink-0 transition-transform duration-200 ${
                      openIndex === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4 animate-in">
                    <p className="text-[#8a8a8a] text-[14px] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center pb-16">
        <Link href="/" className="text-[#8a8a8a] hover:text-white text-[14px] transition-colors">
          ← Back to Mosaic
        </Link>
      </div>
    </div>
  );
}
