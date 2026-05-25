'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getGravatarUrl, generateUserId } from '@/lib/utils';
import { detectFarcaster, getFarcasterUser } from '@/lib/farcaster';

export interface UserData {
  user_id: string;
  username: string;
  display_name: string;
  profile_pic_url: string;
  provider: 'x_oauth' | 'manual' | 'farcaster';
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserData) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'loading'>('choose');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [farcasterAvailable, setFarcasterAvailable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      detectFarcaster().then(setFarcasterAvailable);
    }
  }, [isOpen]);

  // X OAuth via Supabase
  const handleXOAuth = async () => {
    setMode('loading');
    setError('');
    try {
      console.log('[X OAuth] Starting sign-in...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'users.read tweet.read',
        },
      });
      if (error) {
        console.error('[X OAuth] Supabase error:', error);
        throw error;
      }
      if (!data.url) {
        throw new Error('No OAuth URL returned — is the Twitter provider enabled in Supabase?');
      }
      console.log('[X OAuth] Redirecting to:', data.url);
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[X OAuth] Failed:', err);
      const msg = err.message || 'X sign-in failed';
      setError(msg.includes('provider') ? 'X sign-in is not configured yet. Please use manual username for now.' : msg);
      setMode('choose');
    }
  };

  // On page load, check for OAuth callback
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const user: UserData = {
          user_id: generateUserId('x', meta.user_name || meta.full_name || session.user.id),
          username: meta.user_name || meta.full_name || '',
          display_name: meta.full_name || meta.user_name || '',
          profile_pic_url: meta.avatar_url || getGravatarUrl(meta.user_name || 'user'),
          provider: 'x_oauth',
        };
        onLogin(user);
      }
    });
  }, [onLogin]);

  // Farcaster auto-login
  const handleFarcasterLogin = async () => {
    setMode('loading');
    const user = getFarcasterUser();
    if (user) {
      const userData: UserData = {
        user_id: generateUserId('fc', user.username || String(user.fid)),
        username: user.username || `fid:${user.fid}`,
        display_name: user.displayName || user.username || '',
        profile_pic_url: user.pfpUrl || getGravatarUrl(user.username || String(user.fid)),
        provider: 'farcaster',
      };
      onLogin(userData);
    } else {
      setError('Farcaster identity not available');
      setMode('choose');
    }
  };

  // Manual X username entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().replace(/^@/, '');
    if (!trimmed) {
      setError('Please enter your X username');
      return;
    }
    if (trimmed.length > 30) {
      setError('Username too long');
      return;
    }
    const user: UserData = {
      user_id: generateUserId('manual', trimmed),
      username: trimmed,
      display_name: `@${trimmed}`,
      profile_pic_url: getGravatarUrl(trimmed),
      provider: 'manual',
    };
    onLogin(user);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d0e24] border border-[#1a1b3a] rounded-2xl p-8 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl"
        >
          ✕
        </button>

        <h2 className="text-white text-2xl font-bold mb-2">Claim Your Pixel</h2>
        <p className="text-white/50 text-sm mb-8">
          Sign in to claim your spot on the Coinbase Community Mosaic
        </p>

        {mode === 'choose' && (
          <div className="space-y-4">
            {/* X OAuth */}
            <button
              onClick={handleXOAuth}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Sign in with X
            </button>

            {/* Farcaster */}
            {farcasterAvailable && (
              <button
                onClick={handleFarcasterLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#8A63D2] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#7B52C1] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l2.5 8.5L12 22l7.5-6.5L22 7z"/>
                </svg>
                Use Farcaster Identity
              </button>
            )}

            {/* Manual X username - more prominent as working fallback */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1a1b3a]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d0e24] px-4 text-[#0052FF] text-sm font-medium">QUICK ENTRY</span>
              </div>
            </div>

            <p className="text-white/40 text-xs text-center -mt-2">
              No OAuth needed — just type your X handle
            </p>

            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center justify-center gap-3 bg-[#0052FF] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#0045d9] transition-colors"
            >
              Enter X Username Manually
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Your X Username</label>
              <div className="flex items-center bg-[#1a1b3a] rounded-xl border border-[#2a2b4a] focus-within:border-[#0052FF] transition-colors">
                <span className="pl-4 text-white/30">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-transparent text-white py-3 px-2 outline-none"
                  autoFocus
                  maxLength={30}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode('choose'); setError(''); }}
                className="flex-1 py-3 px-4 rounded-xl border border-[#2a2b4a] text-white/60 hover:text-white/80 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-[#0052FF] text-white font-medium hover:bg-[#0045d9] transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {mode === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#0052FF] border-t-transparent rounded-full"></div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
