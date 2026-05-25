'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel } from '@/lib/logo-mask';
import { fetchPixels, claimPixel } from '@/lib/pixels';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';
import { generateUserId, getGravatarUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import LeftPanel from '@/components/LeftPanel';
import MosaicCanvas from '@/components/MosaicCanvas';
import RightPanel from '@/components/RightPanel';
import LoginModal, { UserData } from '@/components/LoginModal';
import ClaimModal from '@/components/ClaimModal';
import CreatorCredit from '@/components/CreatorCredit';
import BottomFeatures from '@/components/BottomFeatures';

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
      if (latest) {
        setLastClaimedAt(new Date(latest).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load pixels:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        const newUser: UserData = {
          user_id: generateUserId('x', meta.user_name || meta.full_name || session.user.id),
          username: meta.user_name || meta.full_name || '',
          display_name: meta.full_name || meta.user_name || '',
          profile_pic_url: meta.avatar_url || getGravatarUrl(meta.user_name || 'user'),
          provider: 'x_oauth',
        };
        setUser(newUser);
        setShowLogin(false);
        if (selectedPixel) setShowClaim(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [selectedPixel]);

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    if (claimed) {
      const key = `${x},${y}`;
      const pixel = pixels.get(key);
      if (pixel) {
        setSelectedClaimedPixel({ x, y, pixel });
        setSelectedPixel(null);
      }
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
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar onConnectClick={() => setShowLogin(true)} />

      {/* Main content — three column layout */}
      <div className="flex-1 flex pt-[60px]" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {/* Left Panel */}
        <div className="hidden lg:block">
          <LeftPanel
            claimedCount={claimedCount}
            lastClaimedAt={lastClaimedAt}
            user={user}
            onConnectClick={() => setShowLogin(true)}
          />
        </div>

        {/* Center Canvas — takes remaining space */}
        <div className="flex-1 relative min-w-0">
          <MosaicCanvas
            pixels={pixels}
            onPixelClick={handlePixelClick}
            onPixelHover={() => {}}
          />
        </div>

        {/* Right Panel — slides in when pixel clicked */}
        {selectedClaimedPixel && (
          <div className="hidden lg:block">
            <RightPanel
              pixel={selectedClaimedPixel.pixel}
              x={selectedClaimedPixel.x}
              y={selectedClaimedPixel.y}
              onClose={() => setSelectedClaimedPixel(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile: Left panel below canvas */}
      <div className="lg:hidden px-4 py-6">
        <LeftPanel
          claimedCount={claimedCount}
          lastClaimedAt={lastClaimedAt}
          user={user}
          onConnectClick={() => setShowLogin(true)}
        />
      </div>

      {/* Bottom Features */}
      <BottomFeatures />

      {/* Footer */}
      <CreatorCredit />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm backdrop-blur-sm">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      {selectedPixel && user && (
        <ClaimModal isOpen={showClaim} onClose={() => setShowClaim(false)} onClaim={handleClaim} user={user} x={selectedPixel.x} y={selectedPixel.y} />
      )}
    </div>
  );
}
