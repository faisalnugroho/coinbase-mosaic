import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080b1a] text-white">
      <section className="pt-24 pb-12 px-4 text-center max-w-lg mx-auto">
        <h1 className="text-white text-[30px] font-extrabold tracking-[-0.025em] leading-[1.15]">
          The Story Behind<br />the Mosaic
        </h1>
        <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-xs mx-auto">
          A permanent digital monument built by thousands. One pixel at a time.
        </p>
      </section>

      <section className="px-4 py-6 max-w-lg mx-auto">
        <div className="glass-card p-6">
          <h2 className="text-white text-base font-bold mb-3 tracking-tight">What is Coinbase Mosaic?</h2>
          <p className="text-white/40 text-[13px] leading-relaxed mb-3">
            Coinbase Community Mosaic is a collaborative digital canvas — a 100×100 pixel grid where every pixel represents a real human being. X (Twitter) users claim their permanent spot in the Coinbase &quot;C&quot; logo, creating a living, breathing artwork that will exist for as long as the internet does.
          </p>
          <p className="text-white/30 text-[13px] leading-relaxed">
            Every claim is permanent. Every pixel is non-transferable. The mosaic grows with each new person who joins, becoming an immutable record of the Coinbase community at this moment in internet history.
          </p>
          <p className="text-white/10 text-[11px] mt-4 italic">
            Community art project inspired by Coinbase. Not affiliated with Coinbase, Inc.
          </p>
        </div>
      </section>

      <section className="px-4 py-6 max-w-lg mx-auto">
        <h2 className="text-white text-base font-bold mb-4 text-center tracking-tight">How It Works</h2>
        <div className="space-y-3">
          {[
            { icon: '🔗', title: 'Connect X', desc: 'Sign in with your X account. Your profile is loaded automatically — no passwords, no accounts, no friction.' },
            { icon: '🎯', title: 'Pick a Pixel', desc: 'Drag and zoom the mosaic. Find an unclaimed pixel inside the Coinbase logo and tap to make it yours.' },
            { icon: '✨', title: 'Leave Your Mark', desc: 'Add a personal message. Claim your pixel permanently. Your profile becomes part of internet history.' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF]/6 flex items-center justify-center text-lg flex-shrink-0 ring-1 ring-[#0052FF]/10">{item.icon}</div>
              <div>
                <h3 className="text-white font-semibold text-[13px] tracking-tight">{item.title}</h3>
                <p className="text-white/30 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 max-w-lg mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0052FF]/15 to-[#0052FF]/3 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#0052FF]/15">
            <span className="text-[#0052FF] text-2xl font-extrabold">Z</span>
          </div>
          <h3 className="text-white font-bold tracking-tight">@Zkfync</h3>
          <p className="text-[#0052FF]/50 text-xs font-medium mt-1">Builder &amp; Web3 Developer</p>
          <p className="text-white/35 text-[13px] leading-relaxed mt-4 max-w-xs mx-auto">
            Building projects that bring people together through technology, art, and community.
          </p>
          <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0052FF] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#0045d9] transition-all mt-5 glow-blue-sm tracking-tight">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Follow @Zkfync
          </a>
        </div>
      </section>

      <div className="text-center pb-16">
        <Link href="/" className="text-white/20 hover:text-white/40 text-xs transition-colors">← Back to Mosaic</Link>
      </div>
    </div>
  );
}
