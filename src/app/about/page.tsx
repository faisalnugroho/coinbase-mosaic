// Rebuilt 1:1 from uploaded image

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-[60px]">
      {/* Hero */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-[42px] font-bold tracking-[-0.02em] leading-[1.15]">
            The Story Behind<br />the Mosaic
          </h1>
          <p className="text-[#8a8a8a] text-[16px] mt-5 leading-relaxed max-w-xl mx-auto">
            What started as an idea to unite the Coinbase community has become a living canvas — 
            where thousands of X users leave their permanent mark, one pixel at a time.
          </p>
        </div>
      </section>

      {/* What is Coinbase Mosaic */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-white text-[24px] font-bold mb-4">What is Coinbase Mosaic?</h2>
          <p className="text-[#8a8a8a] text-[15px] leading-relaxed mb-4">
            Coinbase Community Mosaic is a collaborative digital art piece built on the blockchain.
            It&apos;s a 100×100 pixel grid where each pixel represents a real person — an X (Twitter) user
            who claimed their spot in the Coinbase logo.
          </p>
          <p className="text-[#8a8a8a] text-[15px] leading-relaxed mb-4">
            When fully claimed, the mosaic will display thousands of profile photos forming the iconic
            Coinbase &quot;C&quot; — a testament to the strength and unity of the Coinbase community.
            Every pixel is permanent, non-transferable, and carries a personal message from its owner.
          </p>
          <p className="text-[#8a8a8a] text-[15px] leading-relaxed">
            This is not an official Coinbase product. It&apos;s a community initiative, built by the people,
            for the people — celebrating what makes the Coinbase ecosystem special.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-5 bg-[#111111] border-y border-[#1a1a2e]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-white text-[24px] font-bold mb-10 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0052FF]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-[15px] mb-2">1. Connect X</h3>
              <p className="text-[#8a8a8a] text-[13px] leading-relaxed">
                Sign in with your X (Twitter) account. Your profile photo and username are automatically loaded.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0052FF]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-[15px] mb-2">2. Pick a Pixel</h3>
              <p className="text-[#8a8a8a] text-[13px] leading-relaxed">
                Drag and zoom the canvas. Click any unclaimed pixel inside the Coinbase logo to make it yours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0052FF]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-[15px] mb-2">3. Leave Your Mark</h3>
              <p className="text-[#8a8a8a] text-[13px] leading-relaxed">
                Add a personal message and claim your pixel forever. Your profile photo becomes part of the mosaic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator */}
      <section className="py-20 px-5">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-white text-[24px] font-bold mb-8">Built by the Community</h2>
          <div className="bg-[#111111] border border-[#1a1a2e] rounded-2xl p-8">
            <div className="w-20 h-20 rounded-full bg-[#0052FF]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0052FF] text-3xl font-bold">Z</span>
            </div>
            <h3 className="text-white font-bold text-[18px] mb-1">@Zkfync</h3>
            <p className="text-[#0052FF] text-[13px] font-medium mb-3">Builder &amp; Web3 Developer</p>
            <p className="text-[#8a8a8a] text-[14px] leading-relaxed mb-5 max-w-sm mx-auto">
              Passionate about building community-driven projects that bring people together 
              through technology and creativity.
            </p>
            <a
              href="https://x.com/Zkfync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0052FF] text-white text-[14px] font-medium px-6 py-2.5 rounded-full hover:bg-[#0045d9] transition-all shadow-[0_0_12px_rgba(0,82,255,0.25)]"
            >
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow @Zkfync on X
            </a>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="text-center pb-16">
        <Link href="/" className="text-[#8a8a8a] hover:text-white text-[14px] transition-colors">
          ← Back to Mosaic
        </Link>
      </div>
    </div>
  );
}
