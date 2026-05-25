'use client';
// Coinbase Community Mosaic — Premium neon Web3 pixel art experience

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';
import { fetchPixels, claimPixel } from '@/lib/pixels';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';
import { generateUserId, getGravatarUrl } from '@/lib/utils';
import MosaicCanvas from '@/components/MosaicCanvas';
import LoginModal, { UserData } from '@/components/LoginModal';
import ClaimModal from '@/components/ClaimModal';

export default function Home() {
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedClaimedPixel, setSelectedClaimedPixel] = useState<{ x: number; y: number; pixel: Pixel } | null>(null);
  const [claimedCount, setClaimedCount] = useState(0);
  const [lastClaimedAt, setLastClaimedAt] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.scroll-reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    loadPixels();
    detectFarcaster().then(isFc => {
      if (isFc) { const fc = getFarcasterUser(); if (fc) setUser({ user_id: generateUserId('fc', fc.username || String(fc.fid)), username: fc.username || `fid:${fc.fid}`, display_name: fc.displayName || fc.username || '', profile_pic_url: fc.pfpUrl || getGravatarUrl(fc.username || String(fc.fid)), provider: 'farcaster' }); }
    });
  }, []);

  const loadPixels = async () => {
    try {
      const m = await fetchPixels(supabase); setPixels(m); setClaimedCount(m.size);
      let l: string | null = null; m.forEach(p => { if (p.claimed_at && (!l || p.claimed_at > l)) l = p.claimed_at; });
      if (l) setLastClaimedAt(new Date(l).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_IN' && session?.user) { const m = session.user.user_metadata; setUser({ user_id: generateUserId('x', m.user_name || m.full_name || session.user.id), username: m.user_name || m.full_name || '', display_name: m.full_name || m.user_name || '', profile_pic_url: m.avatar_url || getGravatarUrl(m.user_name || 'user'), provider: 'x_oauth' }); setShowLogin(false); if (selectedPixel) setShowClaim(true); } }); return () => subscription.unsubscribe(); }, [selectedPixel]);

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    if (claimed) { const p = pixels.get(`${x},${y}`); if (p) { setSelectedClaimedPixel({ x, y, pixel: p }); setSelectedPixel(null); } return; }
    setSelectedPixel({ x, y }); setSelectedClaimedPixel(null);
    if (user) setShowClaim(true); else setShowLogin(true);
  }, [user, pixels]);

  const handleLogin = useCallback((u: UserData) => { setUser(u); setShowLogin(false); if (selectedPixel) setShowClaim(true); }, [selectedPixel]);

  const handleClaim = async (message: string) => {
    if (!user || !selectedPixel) return;
    try {
      const p = await claimPixel(supabase, selectedPixel.x, selectedPixel.y, user.user_id, user.username, user.display_name, user.profile_pic_url, message);
      setPixels(prev => new Map(prev).set(`${p.x},${p.y}`, p));
      setClaimedCount(prev => prev + 1);
      setLastClaimedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setShowClaim(false); setSelectedPixel(null);
      setSelectedClaimedPixel({ x: p.x, y: p.y, pixel: p });
      // Confetti
      setConfetti(true); setTimeout(() => setConfetti(false), 2000);
      loadPixels();
    } catch (e: any) { throw e; }
  };

  const remaining = TOTAL_LOGO_PIXELS - claimedCount;
  const pct = TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0;

  // Sample claimed pixels for marquee
  const claimedPixels = Array.from(pixels.values()).slice(0, 20);

  return (
    <div className="min-h-screen bg-[#04070F] text-[#F0F4FF]" style={{ opacity: contentVisible ? 1 : 0 }}>
      {/* CONFETTI */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-[200]">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              background: ['#0052FF', '#7C3AED', '#00FFA3', '#FFD700', '#FF69B4'][i % 5],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              width: `${4 + Math.random() * 8}px`, height: `${4 + Math.random() * 8}px`,
            }} />
          ))}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#04070F]/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-bold text-xs font-mono shadow-[0_0_12px_rgba(0,82,255,0.4)]">CM</div>
            <span className="hidden sm:block text-white/60 text-xs tracking-wide">community mosaic</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {['Canvas', 'How It Works', 'FAQ'].map(l => (
              <a key={l} href={l === 'Canvas' ? '/' : l === 'FAQ' ? '/faq' : '#how'} className="px-4 py-1.5 text-white/50 hover:text-white text-xs rounded-full hover:bg-white/[0.04] transition-all">{l}</a>
            ))}
          </div>
          <button onClick={() => setShowLogin(true)} className="bg-[#0052FF] text-white text-xs font-semibold px-4 h-8 rounded-full hover:bg-[#0045d9] transition-all animate-glow-pulse flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>Claim Pixel
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-4 pt-16 pb-6 text-center max-w-2xl mx-auto overflow-hidden">
        {/* Floating avatar tiles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute animate-float" style={{
              left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.8}s`, animationDuration: `${5 + Math.random() * 4}s`,
            }}>
              <div className="w-8 h-8 rounded-lg bg-[#0052FF]/20 border border-[#0052FF]/20" />
            </div>
          ))}
        </div>

        <h1 className="relative text-[36px] sm:text-[48px] font-bold leading-[1.1] tracking-[-0.03em] font-display">
          <span className="text-gradient">One Account.<br />One Pixel. Forever.</span>
        </h1>
        <p className="text-white/40 text-sm mt-4 max-w-md mx-auto leading-relaxed">
          Join thousands building the internet&apos;s most permanent community monument.
        </p>

        {/* Progress arc + counter */}
        <div className="mt-8 glass max-w-xs mx-auto p-4 flex items-center gap-4">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="url(#pg)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${pct * 1.76} 176`} className="transition-all duration-1000" />
            <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0052FF"/><stop offset="100%" stopColor="#00FFA3"/></linearGradient></defs>
          </svg>
          <div className="text-left">
            <div className="text-white text-xl font-bold font-display tabular-nums">{claimedCount.toLocaleString()}</div>
            <div className="text-white/40 text-xs">pixels claimed</div>
            <div className="text-[#00FFA3] text-[10px] mt-0.5 font-medium">{remaining.toLocaleString()} remaining</div>
          </div>
        </div>
      </section>

      {/* CANVAS SECTION */}
      <section className="px-3 py-6 max-w-[560px] mx-auto">
        {/* Canvas header bar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00FFA3] text-[11px] font-medium font-display">Live Mosaic</span>
          </div>
          <div className="text-white/30 text-[10px]">{pct}% Complete</div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.04] rounded-full mb-3 overflow-hidden">
          <div className="h-full progress-shimmer rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>

        {/* Canvas container */}
        <div className="relative glass overflow-hidden border border-[#0052FF]/10" style={{ height: 'min(460px, 70vw)' }}>
          <MosaicCanvas pixels={pixels} onPixelClick={handlePixelClick} claimedCount={claimedCount} />
        </div>

        {/* CTA bar */}
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-white/20 text-[10px]">Tap a pixel · Drag to explore · Pinch to zoom</p>
          {!user ? (
            <button onClick={() => setShowLogin(true)} className="bg-[#0052FF] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#0045d9] transition-all glow-blue-sm flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
              Claim Pixel
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <img src={user.profile_pic_url} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-[#0052FF]/30"
                onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
              <span className="text-[#00FFA3] text-[10px] font-medium">Claimed ✓</span>
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-4 py-10 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🔒', title: 'Permanent', desc: 'Once claimed, forever yours. An immutable mark on the community canvas.' },
            { icon: '⛓️', title: 'Onchain-Ready', desc: 'Built for permanence. Your pixel lives as a lasting digital artifact.' },
            { icon: '🌐', title: 'Community', desc: 'Thousands united. One mosaic. Each pixel carries a story.' },
          ].map((f, i) => (
            <div key={i} className="glass scroll-reveal p-5 hover:border-[#0052FF]/20 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF]/8 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm font-display">{f.title}</h3>
              <p className="text-white/35 text-xs mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-4 py-10 max-w-3xl mx-auto scroll-reveal">
        <h2 className="text-white text-xl font-bold text-center font-display mb-8">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
          {[
            { step: '1', icon: '🔗', title: 'Connect X', desc: 'Sign in with your X account. No passwords, no signups.' },
            { step: '2', icon: '🎯', title: 'Pick Your Pixel', desc: 'Drag and zoom. Find an empty pixel and tap to claim it.' },
            { step: '3', icon: '✨', title: 'Leave Your Mark', desc: 'Add a message. Your profile becomes part of the mosaic forever.' },
          ].map((s, i) => (
            <div key={i} className="glass p-5 text-center relative hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052FF] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold mx-auto mb-3 shadow-[0_0_15px_rgba(0,82,255,0.3)]">{s.step}</div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <h3 className="text-white font-semibold text-sm font-display">{s.title}</h3>
              <p className="text-white/35 text-xs mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <section className="py-8 overflow-hidden border-y border-white/[0.03]">
        <div className="flex animate-marquee gap-3" style={{ width: 'max-content' }}>
          {[...Array(30)].map((_, i) => {
            const p = claimedPixels[i % claimedPixels.length || 0];
            return (
              <div key={i} className="flex items-center gap-2 glass px-3 py-2 flex-shrink-0">
                {p ? (
                  <>
                    <img src={p.profile_pic_url || ''} alt="" className="w-5 h-5 rounded-full object-cover"
                      onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
                    <span className="text-white/50 text-[10px]">@{p.username}</span>
                  </>
                ) : (
                  <span className="text-white/20 text-[10px]">Available</span>
                )}
              </div>
            );
          })}
          {/* Duplicate for seamless loop */}
          {[...Array(30)].map((_, i) => {
            const p = claimedPixels[i % claimedPixels.length || 0];
            return (
              <div key={`dup-${i}`} className="flex items-center gap-2 glass px-3 py-2 flex-shrink-0">
                {p ? (
                  <>
                    <img src={p.profile_pic_url || ''} alt="" className="w-5 h-5 rounded-full object-cover"
                      onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
                    <span className="text-white/50 text-[10px]">@{p.username}</span>
                  </>
                ) : (
                  <span className="text-white/20 text-[10px]">Available</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-12 max-w-3xl mx-auto text-center border-t border-white/[0.03]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-[#0052FF] flex items-center justify-center text-white font-bold text-[10px] font-mono">CM</div>
          <span className="text-white/40 text-xs">community mosaic</span>
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <a href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">Canvas</a>
          <a href="/about" className="text-white/25 hover:text-white/50 text-xs transition-colors">About</a>
          <a href="/faq" className="text-white/25 hover:text-white/50 text-xs transition-colors">FAQ</a>
        </div>
        <p className="text-white/08 text-[10px] italic max-w-xs mx-auto">
          Community art inspired by Coinbase. Not affiliated with Coinbase, Inc.
        </p>
        <p className="text-white/15 text-[10px] mt-3">
          Created by <a href="https://x.com/Zkfync" target="_blank" rel="noopener" className="text-[#0052FF]/60 hover:text-[#0052FF] transition-colors font-medium">@Zkfync</a>
        </p>
      </footer>

      {/* PIXEL DETAIL MODAL */}
      {selectedClaimedPixel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedClaimedPixel(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 glass p-6 animate-scale-in z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2"><button onClick={() => setSelectedClaimedPixel(null)} className="text-white/20 hover:text-white/60">✕</button></div>
            <div className="text-center">
              <div className="text-white/30 text-xs mb-3 font-mono">#{selectedClaimedPixel.x},{selectedClaimedPixel.y}</div>
              <img src={selectedClaimedPixel.pixel.profile_pic_url || ''} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0052FF]/30 mx-auto mb-3"
                onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-white font-semibold font-display">{selectedClaimedPixel.pixel.display_name}</span>
              </div>
              <div className="text-white/40 text-sm">@{selectedClaimedPixel.pixel.username}</div>
              {selectedClaimedPixel.pixel.message && <p className="text-white/50 text-[13px] italic mt-3">&ldquo;{selectedClaimedPixel.pixel.message}&rdquo;</p>}
              {selectedClaimedPixel.pixel.claimed_at && <div className="text-white/25 text-xs mt-2">{new Date(selectedClaimedPixel.pixel.claimed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
              <div className="flex gap-2.5 mt-5">
                <a href={`https://x.com/${selectedClaimedPixel.pixel.username}`} target="_blank" rel="noopener" className="flex-1 glass py-2.5 text-white/50 hover:text-white/70 text-xs transition-all rounded-xl border-white/[0.04]">View on X</a>
                <button onClick={() => { const url = typeof window !== 'undefined' ? window.location.origin : ''; window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('I claimed my pixel on the Coinbase Community Mosaic! 🟦\n\nJoin me:')}&url=${encodeURIComponent(url)}`, '_blank'); }}
                  className="flex-1 bg-[#0052FF] hover:bg-[#0045d9] rounded-xl py-2.5 text-white text-xs font-semibold transition-all glow-blue-sm">Share</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      {selectedPixel && user && <ClaimModal isOpen={showClaim} onClose={() => setShowClaim(false)} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />}
    </div>
  );
}
