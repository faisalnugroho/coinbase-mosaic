'use client';

import Navbar from '@/components/Navbar';
import CreatorCredit from '@/components/CreatorCredit';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <Navbar onConnectClick={() => {}} />

      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-white text-4xl font-bold tracking-tight mb-4">About Coinbase Mosaic</h1>
        <p className="text-white/50 text-lg mb-16 leading-relaxed">
          The world&apos;s largest community-built tribute to Coinbase — one pixel at a time.
        </p>

        {/* What is it */}
        <section className="mb-16">
          <h2 className="text-white text-2xl font-bold mb-4">What is Coinbase Mosaic?</h2>
          <p className="text-white/60 leading-relaxed mb-4">
            Coinbase Mosaic is a collaborative digital art project where thousands of X (Twitter) users each claim a single
            pixel to collectively build an enormous image of the Coinbase logo. Every pixel represents a real person — their
            profile photo, their name, and their message to the community.
          </p>
          <p className="text-white/60 leading-relaxed">
            Once a pixel is claimed, it becomes permanently associated with that user. There is no blockchain, no NFT, no
            token — just a shared canvas that captures a moment in the Coinbase community.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-white text-2xl font-bold mb-6">How It Works</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Connect Your X Account', desc: 'Sign in with your X (Twitter) account — no wallet required, no blockchain, no fees.' },
              { step: '2', title: 'Pick Your Pixel', desc: 'Explore the 100×100 grid mosaic. Zoom in, drag around, and find an empty pixel that calls to you.' },
              { step: '3', title: 'Write Your Message', desc: 'Leave a message up to 100 characters. It could be anything — a quote, a joke, a memory.' },
              { step: '4', title: 'Claim It Forever', desc: 'Your profile photo fills that pixel, your message is inscribed, and it becomes permanently yours.' },
              { step: '5', title: 'Share With the World', desc: 'Post your pixel on X, invite friends, and watch the mosaic grow into something beautiful.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why it matters */}
        <section className="mb-16">
          <h2 className="text-white text-2xl font-bold mb-4">Why It Matters</h2>
          <p className="text-white/60 leading-relaxed mb-4">
            Coinbase has built the infrastructure for millions of people to participate in the cryptoeconomy. This mosaic is
            a celebration of that community — a visual representation of the people who build, trade, create, and believe in
            the onchain future.
          </p>
          <p className="text-white/60 leading-relaxed">
            Every pixel is a person. Every person has a story. Together, they form something greater than the sum of their
            parts — a mosaic of 6,092 voices, permanently etched into the digital fabric.
          </p>
        </section>

        {/* Rules */}
        <section className="mb-16">
          <h2 className="text-white text-2xl font-bold mb-4">The Rules</h2>
          <ul className="space-y-3 text-white/60">
            <li className="flex gap-2"><span className="text-[#0052FF]">•</span> One X account = one pixel. No exceptions.</li>
            <li className="flex gap-2"><span className="text-[#0052FF]">•</span> Pixels are permanent. Once claimed, they cannot be changed or transferred.</li>
            <li className="flex gap-2"><span className="text-[#0052FF]">•</span> No bots, no scripts, no bulk claiming. Real humans only.</li>
            <li className="flex gap-2"><span className="text-[#0052FF]">•</span> Messages must be appropriate. No hate speech, no harassment.</li>
            <li className="flex gap-2"><span className="text-[#0052FF]">•</span> This is a community art project. Not affiliated with Coinbase Inc.</li>
          </ul>
        </section>

        {/* Creator */}
        <section className="mb-16 border-t border-white/[0.06] pt-16">
          <h2 className="text-white text-2xl font-bold mb-6">Created by @Zkfync</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-full bg-[#0052FF] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              Z
            </div>
            <div>
              <p className="text-white/70 leading-relaxed mb-4">
                <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline font-medium">@Zkfync</a> is a builder and creator
                passionate about community-driven digital art and the Coinbase ecosystem. This mosaic was built as a love letter
                to the onchain community — a place where anyone can leave their permanent mark.
              </p>
              <a
                href="https://x.com/Zkfync"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl py-2.5 px-5 text-white/70 text-sm transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Follow @Zkfync on X
              </a>
            </div>
          </div>
        </section>
      </div>

      <CreatorCredit />
    </div>
  );
}
