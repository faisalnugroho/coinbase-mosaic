'use client';
// Mosaic — A permanent digital monument built by humans online.

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
  const [recentClaims, setRecentClaims] = useState<{ username: string; x: number; y: number }[]>([]);
  const [liveFeed, setLiveFeed] = useState<{ username: string; time: string }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ username: string; display_name: string; profile_pic_url: string }[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [showAllFeed, setShowAllFeed] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => { loadPixels(); detectFarcaster().then(fc => { if (fc) { const u = getFarcasterUser(); if (u) setUser({ user_id: generateUserId('fc', u.username || String(u.fid)), username: u.username || `fid:${u.fid}`, display_name: u.displayName || u.username || '', profile_pic_url: u.pfpUrl || getGravatarUrl(u.username || String(u.fid)), provider: 'farcaster' }); } }); }, []);

  const loadPixels = async () => {
    try {
      const m = await fetchPixels(supabase); setPixels(m); setClaimedCount(m.size);
      // Build leaderboard
      const lb: { username: string; display_name: string; profile_pic_url: string }[] = [];
      m.forEach(p => { if (p.username && p.display_name) lb.push({ username: p.username, display_name: p.display_name, profile_pic_url: p.profile_pic_url || '' }); });
      setLeaderboard(lb.slice(0, 12));
      // Last 10 claims for feed
      const sorted = Array.from(m.values()).filter(p => p.claimed_at).sort((a, b) => new Date(b.claimed_at!).getTime() - new Date(a.claimed_at!).getTime());
      setLiveFeed(sorted.slice(0, 10).map(p => ({ username: p.username || 'unknown', time: p.claimed_at! })));
      setRecentClaims(sorted.slice(0, 5).map(p => ({ username: p.username || 'unknown', x: p.x, y: p.y })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange((e, s) => { if (e === 'SIGNED_IN' && s?.user) { const m = s.user.user_metadata; setUser({ user_id: generateUserId('x', m.user_name || m.full_name || s.user.id), username: m.user_name || m.full_name || '', display_name: m.full_name || m.user_name || '', profile_pic_url: m.avatar_url || getGravatarUrl(m.user_name || 'user'), provider: 'x_oauth' }); setShowLogin(false); if (selectedPixel) setShowClaim(true); } }); return () => subscription.unsubscribe(); }, [selectedPixel]);

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    if (claimed) { const p = pixels.get(`${x},${y}`); if (p) { setSelectedClaimedPixel({ x, y, pixel: p }); setSelectedPixel(null); } return; }
    setSelectedPixel({ x, y }); setSelectedClaimedPixel(null);
    if (user) setShowClaim(true); else setShowLogin(true);
  }, [user, pixels]);

  const handleClaim = async (msg: string) => {
    if (!user || !selectedPixel) return;
    try {
      const p = await claimPixel(supabase, selectedPixel.x, selectedPixel.y, user.user_id, user.username, user.display_name, user.profile_pic_url, msg);
      setPixels(prev => new Map(prev).set(`${p.x},${p.y}`, p));
      setClaimedCount(c => c + 1);
      setRecentClaims(prev => [{ username: user.username, x: p.x, y: p.y }, ...prev].slice(0, 5));
      setLiveFeed(prev => [{ username: user.username, time: new Date().toISOString() }, ...prev].slice(0, 12));
      setShowClaim(false); setSelectedPixel(null);
      setConfetti(true); setTimeout(() => setConfetti(false), 2500);
      loadPixels();
    } catch (e: any) { throw e; }
  };

  const remaining = TOTAL_LOGO_PIXELS - claimedCount;
  const pct = TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#030611] text-[#f0f3fa]">
      {/* CONFETTI */}
      {confetti && <div className="fixed inset-0 pointer-events-none z-[200]">{[...Array(50)].map((_, i) => <div key={i} className="absolute w-2 h-2 rounded-sm" style={{ left: `${Math.random()*100}%`, top: '-5%', background: ['#0052FF','#00b4d8','#7C3AED','#f0f3fa'][i%4], animation: `drift ${1.5+Math.random()*2}s ease-out forwards`, '--dx': `${(Math.random()-0.5)*200}px`, '--dy': `${200+Math.random()*300}px` } as any} />)}</div>}

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#030611]/75 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#00b4d8] flex items-center justify-center text-white font-bold text-[11px]">M</div>
            <span className="text-white/40 text-xs tracking-wide hidden sm:inline">community mosaic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/25 text-[11px] tabular-nums">{claimedCount.toLocaleString()} pixels</span>
            <button onClick={() => setShowLogin(true)} className="bg-[#0052FF] text-white text-xs font-semibold px-4 h-8 rounded-full hover:bg-[#0039b3] transition-all glow-sm flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>Claim Pixel
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-5 pt-20 pb-8 text-center max-w-3xl mx-auto overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0052FF]/5 blur-[120px]" />
        </div>
        <h1 className="relative text-[38px] sm:text-[52px] font-extrabold leading-[1.08] tracking-[-0.03em] reveal">
          <span className="text-gradient">One Account.<br />One Pixel.<br />One Place in History.</span>
        </h1>
        <p className="text-[#5c6880] text-base mt-5 max-w-lg mx-auto leading-relaxed reveal r1">
          Every connected profile becomes part of a living digital monument —<br />built in realtime by thousands of humans.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 reveal r2">
          <button onClick={() => setShowLogin(true)} className="bg-[#0052FF] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#0039b3] transition-all text-sm glow flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>Claim Your Pixel
          </button>
          <a href="#canvas" className="text-[#5c6880] hover:text-white text-sm font-medium px-5 py-3 transition-colors">Explore →</a>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-10 reveal r3">
          {[
            { v: claimedCount.toLocaleString(), l: 'Claimed' },
            { v: remaining.toLocaleString(), l: 'Available' },
            { v: `${pct}%`, l: 'Complete' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-white text-2xl font-bold tabular-nums">{s.v}</div>
              <div className="text-[#5c6880] text-[11px] uppercase tracking-wider mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CANVAS */}
      <section id="canvas" className="px-3 py-6 max-w-[700px] mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00b4d8] animate-pulse" />
            <span className="text-[#00b4d8] text-[11px] font-semibold uppercase tracking-wider">Live</span>
            <span className="text-white/15 text-[10px]">{pct}% complete</span>
          </div>
          <span className="text-white/20 text-[10px]">{TOTAL_LOGO_PIXELS.toLocaleString()} pixels total</span>
        </div>
        <div className="relative aspect-square w-full glass overflow-hidden border border-[#0052FF]/10 glow">
          <MosaicCanvas pixels={pixels} onPixelClick={handlePixelClick} recentClaims={recentClaims} />
        </div>
        <p className="text-center text-white/15 text-[11px] mt-3">Drag to explore · Scroll to zoom · Tap a pixel to claim</p>
      </section>

      {/* LIVE FEED */}
      <section className="px-5 py-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider">Live Activity</h2>
          {liveFeed.length > 5 && <button onClick={() => setShowAllFeed(!showAllFeed)} className="text-[#5c6880] hover:text-white text-xs transition-colors">{showAllFeed ? 'Show less' : 'View all'}</button>}
        </div>
        <div className="space-y-1.5">
          {(showAllFeed ? liveFeed : liveFeed.slice(0, 5)).map((f, i) => (
            <div key={i} className="flex items-center gap-3 glass px-4 py-2.5 reveal-on-scroll" style={{ transitionDelay: `${i * 50}ms` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00b4d8] flex-shrink-0" />
              <span className="text-white/70 text-xs"><span className="text-white font-semibold">@{f.username}</span> joined the mosaic</span>
              <span className="text-[#5c6880] text-[10px] ml-auto flex-shrink-0">{new Date(f.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-12 max-w-3xl mx-auto">
        <h2 className="text-white text-lg font-bold text-center reveal-on-scroll mb-10">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Connect', desc: 'Sign in with your X account. One click. Your profile is loaded automatically.' },
            { step: '02', title: 'Choose', desc: 'Explore the mosaic. Find an empty pixel that calls to you. Claim your place.' },
            { step: '03', title: 'Become', desc: 'Your profile becomes part of the monument. Permanent. Visible to everyone. Forever.' },
          ].map((s, i) => (
            <div key={i} className="glass p-6 reveal-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="text-[#0052FF] text-[11px] font-bold mb-3">{s.step}</div>
              <h3 className="text-white font-bold text-sm mb-2">{s.title}</h3>
              <p className="text-[#5c6880] text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD */}
      {leaderboard.length > 0 && (
        <section className="px-5 py-10 max-w-3xl mx-auto">
          <h2 className="text-white text-lg font-bold text-center reveal-on-scroll mb-6">Early Contributors</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {leaderboard.map((c, i) => (
              <div key={i} className="glass px-3 py-2 flex items-center gap-2 reveal-on-scroll" style={{ transitionDelay: `${i * 40}ms` }}>
                <img src={c.profile_pic_url} alt="" className="w-6 h-6 rounded-full object-cover" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
                <span className="text-white/70 text-xs">@{c.username}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="px-5 py-14 max-w-3xl mx-auto text-center border-t border-white/[0.03]">
        <div className="text-white/20 text-xs mb-4">A permanent digital monument built by the internet community.</div>
        <div className="flex justify-center gap-6 mb-6">
          <a href="/about" className="text-white/25 hover:text-white/50 text-xs transition-colors">About</a>
          <a href="/faq" className="text-white/25 hover:text-white/50 text-xs transition-colors">FAQ</a>
          <a href="https://x.com/Zkfync" target="_blank" rel="noopener" className="text-white/25 hover:text-white/50 text-xs transition-colors">@Zkfync</a>
        </div>
        <p className="text-white/06 text-[10px] italic">Community art project. Not affiliated with Coinbase, Inc.</p>
      </footer>

      {/* PIXEL DETAIL MODAL */}
      {selectedClaimedPixel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedClaimedPixel(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 glass p-6 fade-scale z-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2"><button onClick={() => setSelectedClaimedPixel(null)} className="text-white/20 hover:text-white/60 text-lg">×</button></div>
            <div className="text-center">
              <div className="text-white/25 text-xs mb-3 font-mono">Pixel #{selectedClaimedPixel.x},{selectedClaimedPixel.y}</div>
              <img src={selectedClaimedPixel.pixel.profile_pic_url || ''} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#0052FF]/25 mx-auto mb-4" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
              <div className="text-white font-bold text-lg">{selectedClaimedPixel.pixel.display_name}</div>
              <div className="text-[#5c6880] text-sm">@{selectedClaimedPixel.pixel.username}</div>
              {selectedClaimedPixel.pixel.message && <p className="text-white/50 text-sm italic mt-3">&ldquo;{selectedClaimedPixel.pixel.message}&rdquo;</p>}
              {selectedClaimedPixel.pixel.claimed_at && <div className="text-white/20 text-xs mt-2">{new Date(selectedClaimedPixel.pixel.claimed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
              <div className="flex gap-2.5 mt-5">
                <a href={`https://x.com/${selectedClaimedPixel.pixel.username}`} target="_blank" rel="noopener" className="flex-1 glass py-2.5 text-white/50 hover:text-white/70 text-xs transition-all rounded-xl">View on X</a>
                <button onClick={() => { const url = typeof window !== 'undefined' ? window.location.origin : ''; window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('I claimed my place in the Mosaic. 🟦\n\nJoin me:')}&url=${encodeURIComponent(url)}`, '_blank'); }} className="flex-1 bg-[#0052FF] hover:bg-[#0039b3] rounded-xl py-2.5 text-white text-xs font-semibold transition-all glow-sm">Share</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={(u: UserData) => { setUser(u); setShowLogin(false); if (selectedPixel) setShowClaim(true); }} />
      {selectedPixel && user && <ClaimModal isOpen={showClaim} onClose={() => setShowClaim(false)} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />}
    </div>
  );
}
