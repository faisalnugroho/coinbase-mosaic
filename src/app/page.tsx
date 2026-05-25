'use client';
// Premium Coinbase Community Mosaic — World-class Web3 social monument

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';
import { fetchPixels, claimPixel } from '@/lib/pixels';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';
import { generateUserId, getGravatarUrl } from '@/lib/utils';
import MosaicCanvas from '@/components/MosaicCanvas';
import SplashScreen from '@/components/SplashScreen';
import LoginModal, { UserData } from '@/components/LoginModal';
import ClaimModal from '@/components/ClaimModal';

export default function Home() {
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [selectedClaimedPixel, setSelectedClaimedPixel] = useState<{ x: number; y: number; pixel: Pixel } | null>(null);
  const [error, setError] = useState('');
  const [claimedCount, setClaimedCount] = useState(0);
  const [lastClaimedAt, setLastClaimedAt] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  // Scroll reveal observer
  useEffect(() => {
    if (!contentVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [contentVisible]);

  useEffect(() => {
    loadPixels();
    detectFarcaster().then((isFc) => {
      if (isFc) {
        const fcUser = getFarcasterUser();
        if (fcUser) {
          setUser({
            user_id: generateUserId('fc', fcUser.username || String(fcUser.fid)),
            username: fcUser.username || `fid:${fcUser.fid}`,
            display_name: fcUser.displayName || fcUser.username || '',
            profile_pic_url: fcUser.pfpUrl || getGravatarUrl(fcUser.username || String(fcUser.fid)),
            provider: 'farcaster',
          });
        }
      }
    });
  }, []);

  const loadPixels = async () => {
    try {
      const pixelMap = await fetchPixels(supabase);
      setPixels(pixelMap);
      setClaimedCount(pixelMap.size);
      let latest: string | null = null;
      pixelMap.forEach((p) => {
        if (p.claimed_at && (!latest || p.claimed_at > latest)) latest = p.claimed_at;
      });
      if (latest) setLastClaimedAt(new Date(latest).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) { console.error('Failed to load pixels:', err); }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        setUser({
          user_id: generateUserId('x', meta.user_name || meta.full_name || session.user.id),
          username: meta.user_name || meta.full_name || '',
          display_name: meta.full_name || meta.user_name || '',
          profile_pic_url: meta.avatar_url || getGravatarUrl(meta.user_name || 'user'),
          provider: 'x_oauth',
        });
        setShowLogin(false);
        if (selectedPixel) setShowClaim(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [selectedPixel]);

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    if (claimed) {
      const pixel = pixels.get(`${x},${y}`);
      if (pixel) { setSelectedClaimedPixel({ x, y, pixel }); setSelectedPixel(null); }
      return;
    }
    setSelectedPixel({ x, y });
    setSelectedClaimedPixel(null);
    setError('');
    if (user) setShowClaim(true);
    else setShowLogin(true);
  }, [user, pixels]);

  const handleLogin = useCallback((userData: UserData) => {
    setUser(userData);
    setShowLogin(false);
    if (selectedPixel) setShowClaim(true);
  }, [selectedPixel]);

  const handleClaim = async (message: string) => {
    if (!user || !selectedPixel) return;
    try {
      const pixel = await claimPixel(supabase, selectedPixel.x, selectedPixel.y, user.user_id, user.username, user.display_name, user.profile_pic_url, message);
      const newPixels = new Map(pixels);
      newPixels.set(`${pixel.x},${pixel.y}`, pixel);
      setPixels(newPixels);
      setClaimedCount(prev => prev + 1);
      setLastClaimedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setShowClaim(false);
      setSelectedPixel(null);
      setError('');
      setSelectedClaimedPixel({ x: pixel.x, y: pixel.y, pixel });
      loadPixels();
    } catch (err: any) { throw err; }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    setTimeout(() => setContentVisible(true), 100);
  };

  const remaining = TOTAL_LOGO_PIXELS - claimedCount;
  const pct = TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0;

  return (
    <>
      {/* === SPLASH SCREEN === */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* === MAIN CONTENT === */}
      <div
        className="min-h-screen bg-[#080b1a] text-white transition-opacity duration-700"
        style={{ opacity: contentVisible ? 1 : 0 }}
      >
        {/* === FLOATING NAVBAR === */}
        <nav className="sticky top-0 z-50 bg-[#080b1a]/75 backdrop-blur-2xl navbar-glow">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(0,82,255,0.3)]">C</div>
              <div className="hidden sm:flex items-baseline gap-1.5">
                <span className="text-white font-semibold text-sm tracking-tight">coinbase</span>
                <span className="text-white/25 text-[10px] tracking-[0.2em] font-medium">MOSAIC</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/35 text-xs tabular-nums font-medium">{claimedCount.toLocaleString()} / {TOTAL_LOGO_PIXELS.toLocaleString()}</span>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-[#0052FF] text-white text-xs font-semibold px-4 h-8 rounded-full hover:bg-[#0045d9] transition-all duration-300 flex items-center gap-1.5 glow-blue-sm hover:shadow-[0_0_25px_rgba(0,82,255,0.35)]"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Connect X
              </button>
            </div>
          </div>
        </nav>

        {/* === HERO === */}
        <section className="px-5 pt-12 pb-2 text-center max-w-lg mx-auto">
          <h1 className="text-white text-[34px] sm:text-[44px] font-extrabold leading-[1.1] tracking-[-0.025em]">
            One account.<br />
            One pixel.{' '}
            <span className="text-[#0052FF]">Forever.</span>
          </h1>
          <p className="text-white/40 text-[15px] mt-4 max-w-[280px] mx-auto leading-relaxed font-medium">
            Together we build the internet&apos;s permanent Coinbase community mosaic.
          </p>
          <p className="text-white/15 text-[12px] mt-3 italic">
            Your place becomes part of digital history.
          </p>
        </section>

        {/* === MOSAIC CANVAS === */}
        <section className="px-3 py-5 max-w-[520px] mx-auto">
          <div className="relative glass-card overflow-hidden animate-scale-in" style={{ height: 'min(440px, 68vw)' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#0052FF]/6 blur-[90px] animate-breathe" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#0052FF]/4 blur-[60px] animate-breathe" style={{ animationDelay: '1.5s' }} />
            </div>
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-[#0052FF] animate-float"
                  style={{
                    width: `${1.5 + Math.random() * 2}px`,
                    height: `${1.5 + Math.random() * 2}px`,
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${7 + Math.random() * 10}s`,
                    opacity: 0.1 + Math.random() * 0.25,
                  }}
                />
              ))}
            </div>
            {/* Canvas */}
            <div className="relative z-10 w-full h-full">
              <MosaicCanvas pixels={pixels} onPixelClick={handlePixelClick} onPixelHover={() => {}} />
            </div>
          </div>
          <p className="text-center text-white/15 text-[11px] mt-3">Drag to explore · Pinch to zoom</p>
        </section>

        {/* === STATS === */}
        <section className="px-4 py-2 max-w-[520px] mx-auto scroll-reveal">
          <div className="glass-card p-5 animate-shimmer">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Claimed', value: claimedCount.toLocaleString() },
                { label: 'Remaining', value: remaining.toLocaleString() },
                { label: 'Latest', value: lastClaimedAt || '--:--' },
              ].map((stat, i) => (
                <div key={i} className={`text-center ${i === 1 ? 'border-x border-white/[0.03]' : ''}`}>
                  <div className="text-white text-[30px] font-bold tabular-nums tracking-[-0.03em]">{stat.value}</div>
                  <div className="text-white/25 text-[11px] mt-0.5 uppercase tracking-[0.12em] font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1 bg-white/[0.03] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #0052FF, #0066ff, #4d94ff)',
                  boxShadow: '0 0 10px rgba(0, 82, 255, 0.5)',
                }}
              />
            </div>
          </div>
        </section>

        {/* === MAIN CTA === */}
        <section className="px-4 py-3 max-w-[520px] mx-auto scroll-reveal">
          {!user ? (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full bg-[#0052FF] text-white font-bold py-[15px] rounded-2xl hover:bg-[#0045d9] transition-all duration-300 text-[15px] flex items-center justify-center gap-2.5 glow-blue hover:shadow-[0_0_40px_rgba(0,82,255,0.4)] tracking-tight"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Claim Your Permanent Pixel
            </button>
          ) : (
            <div className="glass-card p-4 flex items-center gap-3">
              <img src={user.profile_pic_url} alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0052FF]/25"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'; }} />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate">{user.display_name}</div>
                <div className="text-white/35 text-xs truncate">@{user.username}</div>
              </div>
              <span className="text-emerald-400 text-[11px] font-semibold bg-emerald-400/8 px-2.5 py-1 rounded-full">Claimed</span>
            </div>
          )}
        </section>

        {/* === PIXEL DETAIL MODAL === */}
        {selectedClaimedPixel && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedClaimedPixel(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 glass-card p-6 animate-fade-up z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button onClick={() => setSelectedClaimedPixel(null)} className="text-white/20 hover:text-white/60 text-lg transition-colors">✕</button>
              </div>
              <div className="text-center">
                <div className="text-white/30 text-xs mb-3 font-mono">Pixel ({selectedClaimedPixel.x}, {selectedClaimedPixel.y})</div>
                <img src={selectedClaimedPixel.pixel.profile_pic_url || ''} alt=""
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0052FF]/25 mx-auto mb-3"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'; }} />
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-white font-semibold text-[15px]">{selectedClaimedPixel.pixel.display_name}</span>
                  <svg className="w-3.5 h-3.5 text-[#0052FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <div className="text-white/35 text-sm">@{selectedClaimedPixel.pixel.username}</div>
                {selectedClaimedPixel.pixel.message && (
                  <p className="text-white/55 text-[13px] italic mt-3 leading-relaxed">&ldquo;{selectedClaimedPixel.pixel.message}&rdquo;</p>
                )}
                {selectedClaimedPixel.pixel.claimed_at && (
                  <div className="text-white/25 text-xs mt-2">
                    {new Date(selectedClaimedPixel.pixel.claimed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
                <div className="flex gap-2.5 mt-5">
                  <a href={`https://x.com/${selectedClaimedPixel.pixel.username}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl py-2.5 text-white/50 hover:text-white/70 text-xs transition-all">
                    View on X
                  </a>
                  <button onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.origin : '';
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('I claimed my pixel on the Coinbase Community Mosaic! 🟦\n\nJoin me:')}&url=${encodeURIComponent(url)}`, '_blank');
                  }} className="flex-1 bg-[#0052FF] hover:bg-[#0045d9] rounded-xl py-2.5 text-white text-xs font-semibold transition-all glow-blue-sm">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === FEATURES === */}
        <section className="px-4 py-10 max-w-[520px] mx-auto">
          <div className="space-y-3">
            {[
              { icon: '🔒', title: 'Permanent', desc: 'Once claimed, your pixel is forever yours. An immutable mark on the community canvas that cannot be removed or transferred.' },
              { icon: '⛓️', title: 'Onchain', desc: 'Every claim becomes part of permanent digital history. Your place in the mosaic is recorded for as long as the internet exists.' },
              { icon: '🌐', title: 'Community', desc: 'Thousands of individuals. One unified mosaic. Each pixel carries a story — together they form a living social monument.' },
            ].map((f, i) => (
              <div key={i} className="glass-card p-5 scroll-reveal transition-all duration-500 hover:bg-white/[0.025] hover:border-white/[0.06]">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0052FF]/6 flex items-center justify-center text-lg flex-shrink-0 ring-1 ring-[#0052FF]/10">{f.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold text-sm tracking-tight">{f.title}</h3>
                    <p className="text-white/30 text-[13px] mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === ABOUT === */}
        <section className="px-4 py-6 max-w-[520px] mx-auto scroll-reveal">
          <div className="glass-card p-6 text-center">
            <h2 className="text-white text-lg font-bold tracking-tight mb-3">A Permanent Digital Monument</h2>
            <p className="text-white/35 text-[13px] leading-relaxed max-w-sm mx-auto">
              Coinbase Community Mosaic is a collaborative artwork — a 100×100 pixel canvas where every pixel represents a real person. When fully claimed, thousands of X profile photos form the iconic Coinbase C, creating a permanent record of the community.
            </p>
            <a href="/about" className="inline-block mt-4 text-[#0052FF]/60 hover:text-[#0052FF] text-xs font-medium transition-colors">Learn more →</a>
          </div>
        </section>

        {/* === FAQ === */}
        <section className="px-4 py-6 max-w-[520px] mx-auto scroll-reveal">
          <div className="glass-card p-6 text-center">
            <h2 className="text-white text-lg font-bold tracking-tight mb-3">Questions?</h2>
            <p className="text-white/35 text-[13px] leading-relaxed max-w-sm mx-auto">
              How does it work? Can I change my pixel? Is this official? Find answers to common questions.
            </p>
            <a href="/faq" className="inline-block mt-4 text-[#0052FF]/60 hover:text-[#0052FF] text-xs font-medium transition-colors">View FAQ →</a>
          </div>
        </section>

        {/* === FOOTER === */}
        <footer className="px-4 py-12 max-w-[520px] mx-auto text-center border-t border-white/[0.03]">
          <p className="text-white/18 text-xs mb-2">
            Created by{' '}
            <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer" className="text-[#0052FF]/50 hover:text-[#0052FF] transition-colors font-medium">
              @Zkfync
            </a>
          </p>
          <p className="text-white/10 text-[10px] leading-relaxed max-w-[280px] mx-auto mb-4">
            A permanent social monument built by the internet community.
          </p>
          <p className="text-white/08 text-[10px] leading-relaxed max-w-[300px] mx-auto italic">
            Community art project inspired by Coinbase.<br />Not affiliated with Coinbase, Inc.
          </p>
        </footer>

        {/* === MODALS === */}
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
        {selectedPixel && user && (
          <ClaimModal isOpen={showClaim} onClose={() => setShowClaim(false)} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />
        )}

        {/* Error toast */}
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-4 py-3 text-red-400/80 text-xs backdrop-blur-2xl">
            {error}
            <button onClick={() => setError('')} className="ml-3 text-red-400/40 hover:text-red-400">✕</button>
          </div>
        )}
      </div>
    </>
  );
}
