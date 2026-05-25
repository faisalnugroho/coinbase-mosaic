'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';
import { fetchPixels, claimPixel } from '@/lib/pixels';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';
import { generateUserId, getGravatarUrl } from '@/lib/utils';
import MosaicCanvas from '@/components/MosaicCanvas';
import LoginModal, { UserData } from '@/components/LoginModal';
import ClaimModal from '@/components/ClaimModal';
import PixelDetail from '@/components/PixelDetail';
import ShareButton from '@/components/ShareButton';
import CreatorCredit from '@/components/CreatorCredit';

export default function Home() {
  const [pixels, setPixels] = useState<Map<string, Pixel>>(new Map());
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  
  // Hover state
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number; pixel: Pixel | null; mx: number; my: number } | null>(null);

  // Stats
  const [claimedCount, setClaimedCount] = useState(0);

  // Load pixels on mount
  useEffect(() => {
    loadPixels();

    // Try Farcaster auto-detect
    detectFarcaster().then((isFarcaster) => {
      if (isFarcaster) {
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
    } catch (err) {
      console.error('Failed to load pixels:', err);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
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
        
        // If there's a pending claim, show claim modal
        if (selectedPixel) {
          setShowClaim(true);
        }
      }
    });
  }, [selectedPixel]);

  const handlePixelClick = useCallback((x: number, y: number, claimed: boolean) => {
    if (!isLogoPixel(x, y)) return;
    
    if (claimed) {
      // Show filled pixel detail
      return;
    }

    setSelectedPixel({ x, y });
    setError('');

    if (user) {
      setShowClaim(true);
    } else {
      setShowLogin(true);
    }
  }, [user]);

  const handlePixelHover = useCallback((x: number, y: number, pixel: Pixel | null, clientX: number, clientY: number) => {
    setHoverPixel({ x, y, pixel, mx: clientX, my: clientY });
  }, []);

  const handleLogin = useCallback((userData: UserData) => {
    setUser(userData);
    setShowLogin(false);
    
    // If there's a pending pixel, show claim modal
    if (selectedPixel) {
      setShowClaim(true);
    }
  }, [selectedPixel]);

  const handleClaim = async (message: string) => {
    if (!user || !selectedPixel) return;

    try {
      const pixel = await claimPixel(
        supabase,
        selectedPixel.x,
        selectedPixel.y,
        user.user_id,
        user.username,
        user.display_name,
        user.profile_pic_url,
        message
      );

      // Update local state
      const newPixels = new Map(pixels);
      newPixels.set(`${pixel.x},${pixel.y}`, pixel);
      setPixels(newPixels);
      setClaimedCount(prev => prev + 1);
      
      setShowClaim(false);
      setJustClaimed(message);
      setError('');
      
      // Refresh in background
      loadPixels();
    } catch (err: any) {
      throw err;
    }
  };

  const handleLogout = () => {
    setUser(null);
    supabase.auth.signOut();
  };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="flex flex-col h-screen bg-[#0a0b1e] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#1a1b3a] bg-[#0d0e24]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 40 40" fill="currentColor">
                <circle cx="20" cy="20" r="20"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Coinbase Mosaic</h1>
              <p className="text-white/30 text-xs">Community Wall</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-white/40 text-xs">
              <span className="text-[#0052FF] font-medium">{claimedCount}</span> / {TOTAL_LOGO_PIXELS} claimed
            </div>
            
            {user ? (
              <div className="flex items-center gap-2">
                <img
                  src={user.profile_pic_url}
                  alt={user.display_name}
                  className="w-7 h-7 rounded-full object-cover border border-[#0052FF]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
                  }}
                />
                <span className="text-white/60 text-sm hidden sm:inline">@{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-sm bg-[#0052FF] text-white py-1.5 px-4 rounded-lg hover:bg-[#0045d9] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Success notification */}
      {justClaimed && (
        <div className="fixed top-16 right-4 z-50 bg-[#0052FF] text-white rounded-xl p-4 max-w-sm shadow-2xl animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <div>
              <p className="font-medium text-sm">Pixel Claimed! 🎉</p>
              <p className="text-white/80 text-xs mt-1">&ldquo;{justClaimed}&rdquo;</p>
              <div className="mt-3">
                <ShareButton url={siteUrl} message="" userMessage={justClaimed} />
              </div>
            </div>
            <button
              onClick={() => setJustClaimed(null)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed top-16 right-4 z-50 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <p className="text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400">✕</button>
          </div>
        </div>
      )}

      {/* Main canvas */}
      <main className="flex-1 relative overflow-hidden">
        <MosaicCanvas
          pixels={pixels}
          onPixelClick={handlePixelClick}
          onPixelHover={(x, y, pixel, clientX, clientY) => {
            setHoverPixel({ x, y, pixel, mx: clientX, my: clientY });
          }}
        />

        {/* Hover tooltip */}
        {hoverPixel && (
          <PixelDetail
            x={hoverPixel.x}
            y={hoverPixel.y}
            pixel={hoverPixel.pixel}
            isVisible={!showLogin && !showClaim}
            mouseX={hoverPixel.mx}
            mouseY={hoverPixel.my}
          />
        )}
      </main>

      {/* Footer */}
      <CreatorCredit />

      {/* Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />

      {selectedPixel && user && (
        <ClaimModal
          isOpen={showClaim}
          onClose={() => setShowClaim(false)}
          onClaim={handleClaim}
          user={user}
          x={selectedPixel.x}
          y={selectedPixel.y}
        />
      )}
    </div>
  );
}
