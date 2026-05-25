'use client';
// Mosaic — auth + localStorage persistence

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';
import { fetchPixels, claimPixel } from '@/lib/pixels';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';
import { generateUserId, getGravatarUrl } from '@/lib/utils';
import MosaicCanvas from '@/components/MosaicCanvas';
import LoginModal, { UserData } from '@/components/LoginModal';
import ClaimModal from '@/components/ClaimModal';

const USER_KEY = 'mosaic_user';

function loadSavedUser(): UserData | null {
  try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveUser(u: UserData) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} }
function clearUser() { try { localStorage.removeItem(USER_KEY); } catch {} }

function LinkIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>); }
function TargetIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2.25v3.75m0 12v3.75M2.25 12h3.75m12 0h3.75M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0 0a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/><circle cx="12" cy="12" r="2.25" fill="currentColor"/></svg>); }
function SparkIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>); }

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
  const [claiming, setClaiming] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Restore saved user on mount
  useEffect(() => { const saved = loadSavedUser(); if (saved) setUser(saved); }, []);

  // Animate stats on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStatsAnimated(true); }, { threshold: 0.5 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.08 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => { loadPixels(); detectFarcaster().then(fc => { if (fc) { const u = getFarcasterUser(); if (u) { const ud: UserData = { user_id: generateUserId('fc', u.username || String(u.fid)), username: u.username || `fid:${u.fid}`, display_name: u.displayName || u.username || '', profile_pic_url: u.pfpUrl || getGravatarUrl(u.username || String(u.fid)), provider: 'farcaster' }; setUser(ud); saveUser(ud); } } }); }, []);

  const loadPixels = async () => {
    try {
      const m = await fetchPixels(supabase); setPixels(m); setClaimedCount(m.size);
      const lb: any[] = []; m.forEach(p => { if (p.username && p.display_name) lb.push({ username: p.username, display_name: p.display_name, profile_pic_url: p.profile_pic_url || '' }); });
      setLeaderboard(lb.slice(0, 12));
      const s = Array.from(m.values()).filter(p => p.claimed_at).sort((a, b) => new Date(b.claimed_at!).getTime() - new Date(a.claimed_at!).getTime());
      setLiveFeed(s.slice(0, 10).map(p => ({ username: p.username || 'unknown', time: p.claimed_at! })));
      setRecentClaims(s.slice(0, 5).map(p => ({ username: p.username || 'unknown', x: p.x, y: p.y })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange((e, s) => { if (e === 'SIGNED_IN' && s?.user) { const m = s.user.user_metadata; const ud: UserData = { user_id: generateUserId('x', m.user_name || m.full_name || s.user.id), username: m.user_name || m.full_name || '', display_name: m.full_name || m.user_name || '', profile_pic_url: m.avatar_url || getGravatarUrl(m.user_name || 'user'), provider: 'x_oauth' }; setUser(ud); saveUser(ud); setShowLogin(false); if (selectedPixel) setShowClaim(true); } }); return () => subscription.unsubscribe(); }, [selectedPixel]);

  const handleLogin = useCallback((ud: UserData) => { setUser(ud); saveUser(ud); setShowLogin(false); if (selectedPixel) setShowClaim(true); }, [selectedPixel]);
  const handleLogout = () => { setUser(null); clearUser(); };

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    if (claimed) { const p = pixels.get(`${x},${y}`); if (p) { setSelectedClaimedPixel({ x, y, pixel: p }); setSelectedPixel(null); } return; }
    setSelectedPixel({ x, y }); setSelectedClaimedPixel(null);
    if (user) setShowClaim(true); else setShowLogin(true);
  }, [user, pixels]);

  const handleClaim = async (msg: string) => {
    if (!user || !selectedPixel || claiming) return;
    setClaiming(true);
    try {
      const p = await claimPixel(supabase, selectedPixel.x, selectedPixel.y, user.user_id, user.username, user.display_name, user.profile_pic_url, msg);
      setPixels(prev => new Map(prev).set(`${p.x},${p.y}`, p)); setClaimedCount(c => c + 1);
      setRecentClaims(prev => [{ username: user.username, x: p.x, y: p.y }, ...prev].slice(0, 5));
      setLiveFeed(prev => [{ username: user.username, time: new Date().toISOString() }, ...prev].slice(0, 12));
      setShowClaim(false); setSelectedPixel(null);
      setConfetti(true); setTimeout(() => setConfetti(false), 2500);
      loadPixels();
    } catch (e: any) { throw e; } finally { setClaiming(false); }
  };

  const remaining = TOTAL_LOGO_PIXELS - claimedCount;
  const pct = TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0;
  const hasClaims = claimedCount > 0;

  return (
    <>
      {confetti && <div className="fixed inset-0 pointer-events-none z-[200]" aria-hidden="true">{[...Array(50)].map((_, i) => <div key={i} className="absolute w-2 h-2 rounded-sm" style={{ left: `${Math.random()*100}%`, top: '-5%', background: ['#0052FF','#00b4d8','#fff','#7C3AED'][i%4], animation: `drift ${1.5+Math.random()*2}s ease-out forwards`, '--dx': `${(Math.random()-0.5)*200}px`, '--dy': `${200+Math.random()*300}px` } as any} />)}</div>}

      <nav className="sticky top-0 z-50 bg-[#030611]/80 backdrop-blur-2xl border-b border-white/[0.03]" role="navigation" aria-label="Main">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#00b4d8] flex items-center justify-center text-white font-bold text-[11px] shadow-[0_0_12px_rgba(0,82,255,0.3)]" aria-hidden="true">M</div>
            <div className="hidden sm:flex items-center gap-5">
              {['Canvas','How It Works','Activity'].map(l => (<a key={l} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} className="text-white/35 hover:text-white text-[13px] transition-colors font-medium">{l}</a>))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/20 text-[12px] tabular-nums hidden sm:inline">{hasClaims ? `${claimedCount.toLocaleString()} claimed` : `${TOTAL_LOGO_PIXELS.toLocaleString()} available`}</span>
            {user ? (
              <div className="flex items-center gap-2">
                <img src={user.profile_pic_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-[#0052FF]/25" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
                <span className="text-white/50 text-[12px] hidden sm:inline">@{user.username}</span>
                <button onClick={handleLogout} className="text-white/20 hover:text-white/50 text-[11px] transition-colors ml-1" title="Sign out">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-[#0052FF] text-white text-[13px] font-semibold px-5 h-9 rounded-full hover:bg-[#0039b3] transition-all glow-sm flex items-center gap-1.5" aria-label="Connect X to claim your pixel">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
                Connect X
              </button>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="relative px-5 pt-16 pb-4 text-center max-w-3xl mx-auto overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0052FF]/4 blur-[140px]" /></div>
          <h1 className="relative text-[40px] sm:text-[54px] font-extrabold leading-[1.06] tracking-[-0.03em] reveal"><span className="text-gradient">One Account.</span><br /><span className="text-gradient">One Pixel.</span><br /><span className="text-gradient">One Place in History.</span></h1>
          <p className="text-[#5c6880] text-[15px] sm:text-base mt-5 max-w-md mx-auto leading-relaxed reveal r1">Every connected profile becomes part of a living digital monument — built in realtime by thousands of humans.</p>
          <div className="flex items-center justify-center gap-3 mt-7 reveal r2">
            <button onClick={() => user ? null : setShowLogin(true)} disabled={claiming}
              className="bg-[#0052FF] text-white font-semibold px-7 py-3.5 rounded-full hover:bg-[#0039b3] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm glow-sm flex items-center gap-2" aria-label={user ? 'You are signed in' : 'Connect X to claim your permanent pixel'}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
              {user ? `Signed in as @${user.username}` : (hasClaims ? 'Claim Your Pixel' : 'Be the First')}
            </button>
            <a href="#canvas" className="text-[#5c6880] hover:text-white text-sm font-medium px-4 py-3.5 transition-colors">Explore ↓</a>
          </div>
          <div ref={statsRef} className="flex items-center justify-center gap-10 mt-8 reveal r3">
            {[{ v: claimedCount.toLocaleString(), l: 'Claimed' }, { v: remaining.toLocaleString(), l: 'Available' }, { v: `${pct}%`, l: 'Complete' }].map((s, i) => (
              <div key={i} className="text-center"><div className={`text-white text-[26px] font-bold tabular-nums ${statsAnimated ? 'count-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 0.15}s` }}>{s.v}</div><div className="text-[#5c6880] text-[11px] uppercase tracking-[0.12em] font-medium mt-0.5">{s.l}</div></div>
            ))}
          </div>
        </section>

        <section id="canvas" className="px-3 py-8 max-w-[700px] mx-auto reveal-on-scroll">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden="true"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasClaims ? 'bg-[#00b4d8]' : 'bg-[#0052FF]/40'} opacity-75`} /><span className={`relative inline-flex rounded-full h-2 w-2 ${hasClaims ? 'bg-[#00b4d8]' : 'bg-[#0052FF]/60'}`} /></span>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${hasClaims ? 'text-[#00b4d8]' : 'text-[#0052FF]/60'}`}>{hasClaims ? 'Live' : 'Ready'}</span>
              {hasClaims && <span className="text-white/15 text-[10px] tabular-nums">{pct}% complete</span>}
            </div>
            <span className="text-white/15 text-[10px] tabular-nums">{TOTAL_LOGO_PIXELS.toLocaleString()} pixels</span>
          </div>
          <div className="relative aspect-square w-full glass overflow-hidden border border-[#0052FF]/6 glow"><MosaicCanvas pixels={pixels} onPixelClick={handlePixelClick} recentClaims={recentClaims} /></div>
          <p className="text-center text-white/12 text-[11px] mt-3 font-medium">Drag to explore · Scroll to zoom · Tap a pixel to claim</p>
        </section>

        <section id="activity" className="px-5 py-8 max-w-3xl mx-auto">
          <h2 className="text-white/70 text-[13px] font-bold uppercase tracking-[0.12em] mb-4 reveal-on-scroll">Activity</h2>
          {hasClaims ? (<><div className="space-y-1 mb-1">{(showAllFeed ? liveFeed : liveFeed.slice(0, 5)).map((f, i) => (<div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl reveal-on-scroll transition-colors ${i % 2 === 0 ? 'bg-white/[0.015]' : ''}`}><span className="w-1.5 h-1.5 rounded-full bg-[#00b4d8] flex-shrink-0" aria-hidden="true" /><span className="text-white/55 text-[13px]"><span className="text-white font-semibold">@{f.username}</span> joined the mosaic</span><span className="text-[#5c6880] text-[11px] ml-auto flex-shrink-0 tabular-nums">{new Date(f.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>))}</div>{liveFeed.length > 5 && <button onClick={() => setShowAllFeed(!showAllFeed)} className="text-[#5c6880] hover:text-white text-xs transition-colors mt-2 ml-4">{showAllFeed ? 'Show less' : `View all ${liveFeed.length} entries`}</button>}</>) : (
            <div className="glass-elevated p-8 text-center reveal-on-scroll border-[#0052FF]/8"><div className="text-4xl mb-4" aria-hidden="true">🟦</div><h3 className="text-white font-bold text-lg mb-2">The Canvas Is Empty</h3><p className="text-[#5c6880] text-sm max-w-xs mx-auto mb-5 leading-relaxed">No one has claimed a pixel yet. The first contributors will be remembered as the founders of this digital monument.</p><button onClick={() => setShowLogin(true)} className="inline-flex bg-[#0052FF] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#0039b3] transition-all text-sm glow-sm">Claim the First Pixel</button></div>
          )}
        </section>

        <section id="how-it-works" className="px-5 py-12 max-w-3xl mx-auto">
          <h2 className="text-white/70 text-[13px] font-bold uppercase tracking-[0.12em] text-center mb-8 reveal-on-scroll">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ step: '01', icon: <LinkIcon />, title: 'Connect', desc: 'Sign in with your X account. One click. Your profile loads.' }, { step: '02', icon: <TargetIcon />, title: 'Choose', desc: 'Find an empty pixel that calls to you. Claim your place.' }, { step: '03', icon: <SparkIcon />, title: 'Become', desc: 'Your profile becomes internet history. Visible forever.' }].map((s, i) => (
              <div key={i} className="glass p-6 reveal-on-scroll hover:border-[#0052FF]/20 hover:bg-white/[0.025] transition-all duration-500 group relative" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="text-[#0052FF]/40 text-[10px] font-bold mb-3 tracking-wider">{s.step}</div><div className="text-[#0052FF] mb-3 group-hover:text-[#00b4d8] group-hover:scale-110 transition-all duration-300 inline-block">{s.icon}</div><h3 className="text-white font-bold text-sm mb-2">{s.title}</h3><p className="text-[#5c6880] text-[13px] leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-px bg-gradient-to-r from-[#0052FF]/40 to-transparent" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </section>

        {leaderboard.length > 0 && (
          <section className="px-5 py-10 max-w-3xl mx-auto"><h2 className="text-white/70 text-[13px] font-bold uppercase tracking-[0.12em] text-center mb-6 reveal-on-scroll">Early Contributors</h2><div className="flex flex-wrap justify-center gap-2">{leaderboard.map((c, i) => (<div key={i} className="glass px-3.5 py-2 flex items-center gap-2 reveal-on-scroll hover:border-[#0052FF]/20 transition-all" style={{ transitionDelay: `${i * 40}ms` }}><img src={c.profile_pic_url} alt={`@${c.username}`} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/5" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} /><span className="text-white/55 text-[13px] font-medium">@{c.username}</span></div>))}</div></section>
        )}

        <footer className="px-5 py-14 max-w-3xl mx-auto text-center border-t border-white/[0.03]" role="contentinfo">
          <div className="flex items-center justify-center gap-2 mb-5"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0052FF] to-[#00b4d8] flex items-center justify-center text-white font-bold text-[10px]" aria-hidden="true">M</div><span className="text-white/20 text-xs">community mosaic</span></div>
          <p className="text-white/15 text-[13px] mb-4">A permanent digital monument built by the internet community.</p>
          <div className="flex justify-center gap-7 mb-6"><a href="/about" className="text-white/25 hover:text-white/50 text-[13px] transition-colors font-medium">About</a><a href="/faq" className="text-white/25 hover:text-white/50 text-[13px] transition-colors font-medium">FAQ</a><a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/50 text-[13px] transition-colors font-medium">@Zkfync</a></div>
          <p className="text-white/10 text-[11px] italic max-w-xs mx-auto leading-relaxed">Community art project inspired by Coinbase. Not affiliated with Coinbase, Inc.</p>
        </footer>
      </main>

      {selectedClaimedPixel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedClaimedPixel(null)} role="dialog" aria-modal="true" aria-label="Pixel details">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 glass-elevated p-6 fade-scale z-10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedClaimedPixel(null)} className="absolute top-4 right-4 text-white/20 hover:text-white/60 text-lg w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.04] transition-all" aria-label="Close">×</button>
            <div className="text-center pt-2"><div className="text-white/25 text-xs mb-3 font-mono">Pixel #{selectedClaimedPixel.x},{selectedClaimedPixel.y}</div><div className="relative inline-block mb-4"><img src={selectedClaimedPixel.pixel.profile_pic_url || ''} alt={`@${selectedClaimedPixel.pixel.username}`} className="w-20 h-20 rounded-full object-cover ring-2 ring-[#0052FF]/25" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} /><div className="absolute inset-0 rounded-full blur-xl bg-[#0052FF]/10 -z-10" aria-hidden="true" /></div><div className="text-white font-bold text-lg">{selectedClaimedPixel.pixel.display_name}</div><div className="text-[#5c6880] text-sm">@{selectedClaimedPixel.pixel.username}</div>{selectedClaimedPixel.pixel.message && <p className="text-white/50 text-sm italic mt-3">&ldquo;{selectedClaimedPixel.pixel.message}&rdquo;</p>}{selectedClaimedPixel.pixel.claimed_at && <div className="text-white/20 text-xs mt-2">{new Date(selectedClaimedPixel.pixel.claimed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}<div className="flex gap-2.5 mt-5"><a href={`https://x.com/${selectedClaimedPixel.pixel.username}`} target="_blank" rel="noopener noreferrer" className="flex-1 glass py-2.5 text-white/50 hover:text-white/70 text-xs transition-all rounded-xl">View on X</a><button onClick={() => { const url = typeof window !== 'undefined' ? window.location.origin : ''; window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('I claimed my place in the Mosaic. 🟦\n\nJoin me:')}&url=${encodeURIComponent(url)}`, '_blank'); }} className="flex-1 bg-[#0052FF] hover:bg-[#0039b3] rounded-xl py-2.5 text-white text-xs font-semibold transition-all glow-sm">Share</button></div></div>
          </div>
        </div>
      )}

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      {selectedPixel && user && <ClaimModal isOpen={showClaim} onClose={() => { setShowClaim(false); setClaiming(false); }} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />}
    </>
  );
}
