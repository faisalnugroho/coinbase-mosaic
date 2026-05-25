import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#04070F] text-[#F0F4FF]">
      <section className="pt-24 pb-12 px-4 text-center max-w-lg mx-auto">
        <h1 className="text-[30px] font-bold font-display tracking-[-0.03em] text-gradient">The Story Behind the Mosaic</h1>
        <p className="text-white/40 text-sm mt-4 max-w-xs mx-auto leading-relaxed">A permanent digital monument. Built by thousands. One pixel at a time.</p>
      </section>

      <section className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="glass p-6">
          <h2 className="text-white text-base font-bold font-display mb-3">What is Coinbase Community Mosaic?</h2>
          <p className="text-white/40 text-[13px] leading-relaxed mb-3">A collaborative 100×100 pixel canvas. Each pixel is permanently claimed by one X user, displaying their profile photo inside the iconic Coinbase C. When every pixel is filled, thousands of faces form a living community artwork.</p>
          <p className="text-white/30 text-[13px] leading-relaxed mb-3">Every claim is permanent. Every pixel is non-transferable. The mosaic grows organically, becoming an immutable record of the community.</p>
          <p className="text-white/10 text-[11px] italic">Not affiliated with Coinbase, Inc. — a community art project.</p>
        </div>

        <div className="glass p-6">
          <h2 className="text-white text-base font-bold font-display mb-3">Why We Built This</h2>
          <p className="text-white/40 text-[13px] leading-relaxed">The internet runs on shared experiences — r/place proved that millions can create together. We wanted to capture that same energy but make it permanent. Every pixel becomes part of digital history.</p>
        </div>

        <div className="glass p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0052FF]/20 to-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#0052FF]/20">
            <span className="text-[#0052FF] text-2xl font-bold font-display">Z</span>
          </div>
          <h3 className="text-white font-bold font-display">@Zkfync</h3>
          <p className="text-[#7C3AED]/60 text-xs font-medium mt-1">Builder &amp; Web3 Developer</p>
          <blockquote className="text-white/35 text-[13px] leading-relaxed mt-4 max-w-xs mx-auto italic">
            &ldquo;The internet is our shared history. The mosaic is a permanent record of who showed up.&rdquo;
          </blockquote>
          <a href="https://x.com/Zkfync" target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-[#0052FF] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#0045d9] transition-all mt-5 glow-blue-sm">
            Follow @Zkfync
          </a>
        </div>
      </section>

      <div className="text-center pb-16"><Link href="/" className="text-white/20 hover:text-white/40 text-xs transition-colors">← Back to Mosaic</Link></div>
    </div>
  );
}
