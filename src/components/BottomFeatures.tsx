'use client';

export default function BottomFeatures() {
  return (
    <section className="border-t border-white/[0.06] bg-[#0a0a0a] py-16 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-[#0052FF]/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Permanent</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            Once you claim a pixel, it&apos;s yours forever. Every pixel is recorded permanently — a lasting mark on the Coinbase community canvas.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-[#0052FF]/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Community</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            6,092 pixels, 6,092 people. Every X user brings their own story. Together we create something bigger than any one of us.
          </p>
        </div>
      </div>
    </section>
  );
}
