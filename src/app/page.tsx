'use client';
// Premium Coinbase-inspired mobile-first redesign

import { useState, useCallback, useEffect } from 'react';
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
  const [error, setError] = useState('');
  const [claimedCount, setClaimedCount] = useState(0);
  const [lastClaimedAt, setLastClaimedAt] = useState<string | null>(null);

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

  const remaining = TOTAL_LOGO_PIXELS - claimedCount;

  return (
    <div className="min-h-screen bg-[#080b1a] text-white">
      {/* === STICKY NAVBAR === */}
      <nav className="sticky top-0 z-50 bg-[#080b1a]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm">C</div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-sm">coinbase</span>
              <span className="text-white/30 text-[10px] tracking-[0.15em] ml-1">MOSAIC</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs tabular-nums">{claimedCount.toLocaleString()} / {TOTAL_LOGO_PIXELS.toLocaleString()}</span>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-[#0052FF] text-white text-xs font-semibold px-4 h-8 rounded-full hover:bg-[#0045d9] transition-all flex items-center gap-1.5 glow-blue-sm"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Connect X
            </button>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION === */}
      <section className="px-4 pt-10 pb-2 text-center max-w-lg mx-auto">
        <h1 className="animate-fade-up text-white text-[32px] sm:text-[40px] font-bold leading-[1.15] tracking-[-0.02em]">
          One account.<br />One pixel. <span className="text-[#0052FF]">Forever.</span>
        </h1>
        <p className="animate-fade-up animate-fade-up-delay-1 text-white/40 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
          Together we build the world&apos;s largest Coinbase community mosaic.
        </p>
      </section>

      {/* === MOSAIC CANVAS === */}
      <section className="px-2 py-4 max-w-[500px] mx-auto">
        <div className="relative glass-card overflow-hidden" style={{ height: 'min(420px, 65vw)' }}>
          {/* Ambient glow behind canvas */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#0052FF]/8 blur-[80px] animate-breathe" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#0052FF]/5 blur-[60px] animate-breathe" style={{ animationDelay: '1s' }} />
          </div>
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#0052FF]/30 animate-float"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${15 + Math.random() * 70}%`,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: `${6 + Math.random() * 8}s`,
                  opacity: 0.15 + Math.random() * 0.3,
                }}
              />
            ))}
          </div>
          {/* Canvas */}
          <div className="relative z-10 w-full h-full">
            <MosaicCanvas
              pixels={pixels}
              onPixelClick={handlePixelClick}
              onPixelHover={() => {}}
            />
          </div>
        </div>
      </section>

      {/* === STATS CARD === */}
      <section className="px-4 py-3 max-w-[500px] mx-auto">
        <div className="glass-card p-5 animate-fade-up animate-fade-up-delay-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-white text-[28px] font-bold tabular-nums tracking-[-0.02em]">{claimedCount.toLocaleString()}</div>
              <div className="text-white/30 text-[11px] mt-0.5 uppercase tracking-wider">Claimed</div>
            </div>
            <div className="text-center border-x border-white/[0.04]">
              <div className="text-white text-[28px] font-bold tabular-nums tracking-[-0.02em]">{remaining.toLocaleString()}</div>
              <div className="text-white/30 text-[11px] mt-0.5 uppercase tracking-wider">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-white text-[28px] font-bold tabular-nums tracking-[-0.02em]">{lastClaimedAt || '--:--'}</div>
              <div className="text-white/30 text-[11px] mt-0.5 uppercase tracking-wider">Latest</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0052FF] to-[#0066ff] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,82,255,0.4)]"
              style={{ width: `${TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0}%` }}
            />
          </div>
        </div>
      </section>

      {/* === MAIN CTA === */}
      <section className="px-4 py-3 max-w-[500px] mx-auto">
        {!user ? (
          <button
            onClick={() => setShowLogin(true)}
            className="w-full bg-[#0052FF] text-white font-semibold py-4 rounded-2xl hover:bg-[#0045d9] transition-all text-sm flex items-center justify-center gap-2 glow-blue animate-fade-up animate-fade-up-delay-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Connect X to claim your pixel
          </button>
        ) : (
          <div className="glass-card p-4 flex items-center gap-3">
            <img src={user.profile_pic_url} alt={user.username} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0052FF]/30"
              onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'; }} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.display_name}</div>
              <div className="text-white/40 text-xs truncate">@{user.username}</div>
            </div>
            <span className="text-green-400 text-[11px] font-semibold bg-green-400/10 px-2.5 py-1 rounded-full">Claimed</span>
          </div>
        )}
      </section>

      {/* === PIXEL DETAIL MODAL (claimed pixel click) === */}
      {selectedClaimedPixel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedClaimedPixel(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 glass-card p-6 animate-fade-up z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelectedClaimedPixel(null)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>
            <div className="text-center">
              <div className="text-white/40 text-xs mb-3">Pixel ({selectedClaimedPixel.x}, {selectedClaimedPixel.y})</div>
              <img src={selectedClaimedPixel.pixel.profile_pic_url || ''} alt=""
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0052FF]/30 mx-auto mb-3"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'; }} />
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-white font-semibold">{selectedClaimedPixel.pixel.display_name}</span>
                <svg className="w-4 h-4 text-[#0052FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <div className="text-white/40 text-sm">@{selectedClaimedPixel.pixel.username}</div>
              {selectedClaimedPixel.pixel.message && (
                <p className="text-white/60 text-sm italic mt-3">&ldquo;{selectedClaimedPixel.pixel.message}&rdquo;</p>
              )}
              {selectedClaimedPixel.pixel.claimed_at && (
                <div className="text-white/30 text-xs mt-2">
                  Claimed {new Date(selectedClaimedPixel.pixel.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <a href={`https://x.com/${selectedClaimedPixel.pixel.username}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl py-2.5 text-white/60 text-xs transition-colors">
                  View on X
                </a>
                <button onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.origin : '';
                  const text = `I claimed my pixel on the Coinbase Community Mosaic! 🟦\n\nJoin me:`;
                  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                }} className="flex-1 bg-[#0052FF] hover:bg-[#0045d9] rounded-xl py-2.5 text-white text-xs font-medium transition-colors">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === FEATURES === */}
      <section className="px-4 py-8 max-w-[500px] mx-auto">
        <div className="space-y-3">
          {[
            { icon: '🔒', title: 'Permanent', desc: 'Once you claim a pixel, it\'s yours forever. An immutable mark on the Coinbase community canvas.' },
            { icon: '⛓️', title: 'Onchain', desc: 'Every claim is permanently recorded. Your pixel lives as a lasting digital artifact.' },
            { icon: '🌐', title: 'Community', desc: 'Thousands of people, one mosaic. Each pixel tells a story — together they form something bigger.' },
          ].map((f, i) => (
            <div key={i} className="glass-card p-5 animate-fade-up" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0052FF]/8 flex items-center justify-center text-lg flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                  <p className="text-white/35 text-xs mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="px-4 py-10 border-t border-white/[0.04] max-w-[500px] mx-auto text-center">
        <div className="flex justify-center gap-6 mb-4">
          <a href="/about" className="text-white/30 hover:text-white/60 text-xs transition-colors">About</a>
          <a href="/faq" className="text-white/30 hover:text-white/60 text-xs transition-colors">FAQ</a>
        </div>
        <p className="text-white/20 text-xs">
          Created by{' '}
          <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer" className="text-[#0052FF]/60 hover:text-[#0052FF] transition-colors font-medium">
            @Zkfync
          </a>
        </p>
        <p className="text-white/10 text-[10px] mt-2">A permanent social monument built by the internet community.</p>
      </footer>

      {/* === MODALS === */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      {selectedPixel && user && (
        <ClaimModal isOpen={showClaim} onClose={() => setShowClaim(false)} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-400/50 hover:text-red-400">✕</button>
        </div>
      )}
    </div>
  );
}
