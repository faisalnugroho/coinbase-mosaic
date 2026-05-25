import Link from 'next/link';
// Premium Coinbase-inspired About page

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080b1a] text-white">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 text-center max-w-lg mx-auto">
        <h1 className="text-white text-[32px] font-bold tracking-[-0.02em] leading-[1.15]">
          The Story Behind<br />the Mosaic
        </h1>
        <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-sm mx-auto">
          A permanent social monument built by the internet community — one pixel at a time.
        </p>
      </section>

      {/* What */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <div className="glass-card p-6">
          <h2 className="text-white text-lg font-bold mb-4">What is Coinbase Mosaic?</h2>
          <p className="text-white/45 text-sm leading-relaxed mb-4">
            Coinbase Community Mosaic is a collaborative digital canvas — a 100×100 pixel grid where each pixel represents a real person. X (Twitter) users claim their spot in the Coinbase &quot;C&quot; logo, creating a living, breathing community artwork.
          </p>
          <p className="text-white/45 text-sm leading-relaxed">
            Every pixel is permanent, non-transferable, and carries a personal message. This is not an official Coinbase product — it&apos;s a community tribute, built by the people, for the people.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-white text-lg font-bold mb-6 text-center">How It Works</h2>
        <div className="space-y-3">
          {[
            { step: '1', icon: '🔗', title: 'Connect X', desc: 'Sign in with your X account. Your profile photo and username are loaded automatically — no passwords, no signups.' },
            { step: '2', icon: '🎯', title: 'Pick a Pixel', desc: 'Drag and zoom the mosaic canvas. Find an unclaimed pixel inside the Coinbase logo and tap to select it.' },
            { step: '3', icon: '✨', title: 'Leave Your Mark', desc: 'Add a personal message and claim your pixel forever. Your profile photo becomes part of the permanent mosaic.' },
          ].map((item) => (
            <div key={item.step} className="glass-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF]/8 flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                <p className="text-white/35 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Creator */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-white text-lg font-bold mb-6 text-center">Built by the Community</h2>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0052FF]/20 to-[#0052FF]/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#0052FF]/20">
            <span className="text-[#0052FF] text-2xl font-bold">Z</span>
          </div>
          <h3 className="text-white font-bold">@Zkfync</h3>
          <p className="text-[#0052FF]/60 text-xs font-medium mt-1">Builder &amp; Web3 Developer</p>
          <p className="text-white/35 text-sm leading-relaxed mt-4 max-w-xs mx-auto">
            Building community-driven projects that bring people together through technology and creativity.
          </p>
          <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0052FF] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#0045d9] transition-all mt-5 glow-blue-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Follow @Zkfync
          </a>
        </div>
      </section>

      <div className="text-center pb-16">
        <Link href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">← Back to Mosaic</Link>
      </div>
    </div>
  );
}
