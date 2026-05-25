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
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [farcasterAvailable, setFarcasterAvailable] = useState(false);
  const [xOauthFailed, setXOauthFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      detectFarcaster().then(setFarcasterAvailable);
      setUsername('');
      setError('');
      setLoading(false);
      setXOauthFailed(false);
    }
  }, [isOpen]);

  // X OAuth — primary auth method
  const handleXOAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (oauthError) throw oauthError;
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('OAuth not configured');
    } catch (err: any) {
      console.warn('[X OAuth] Unavailable, falling back to manual:', err.message);
      setXOauthFailed(true);
      setLoading(false);
    }
  };

  // Check for OAuth callback on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        onLogin({
          user_id: generateUserId('x', meta.user_name || meta.full_name || session.user.id),
          username: meta.user_name || meta.full_name || '',
          display_name: meta.full_name || meta.user_name || '',
          profile_pic_url: meta.avatar_url || getGravatarUrl(meta.user_name || 'user'),
          provider: 'x_oauth',
        });
      }
    });
  }, [onLogin]);

  // Farcaster
  const handleFarcasterLogin = () => {
    const user = getFarcasterUser();
    if (user) {
      onLogin({
        user_id: generateUserId('fc', user.username || String(user.fid)),
        username: user.username || `fid:${user.fid}`,
        display_name: user.displayName || user.username || '',
        profile_pic_url: user.pfpUrl || getGravatarUrl(user.username || String(user.fid)),
        provider: 'farcaster',
      });
    }
  };

  // Manual X username — always visible as fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().replace(/^@/, '');
    if (!trimmed) { setError('Enter your X username'); return; }
    if (trimmed.length > 30) { setError('Username too long'); return; }
    onLogin({
      user_id: generateUserId('manual', trimmed),
      username: trimmed,
      display_name: `@${trimmed}`,
      profile_pic_url: getGravatarUrl(trimmed),
      provider: 'manual',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden fade-scale z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(8,13,26,0.95) 0%, rgba(6,11,26,0.9) 100%)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/25 hover:text-white/60 rounded-full hover:bg-white/[0.04] transition-all text-lg" aria-label="Close">×</button>
        </div>

        <div className="px-6 pb-6 text-center">
          <h2 className="text-white text-xl font-bold tracking-tight mb-1">Claim Your Pixel</h2>
          <p className="text-[#5c6880] text-sm">One account. One pixel. Forever.</p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {/* X OAuth button */}
              <button
                onClick={handleXOAuth}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-100 transition-all text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
                Sign in with X
              </button>

              {/* Farcaster */}
              {farcasterAvailable && (
                <button onClick={handleFarcasterLogin}
                  className="w-full flex items-center justify-center gap-3 bg-[#8A63D2]/90 text-white font-semibold py-3.5 rounded-xl hover:bg-[#7B52C1] transition-all text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l2.5 8.5L12 22l7.5-6.5L22 7z"/></svg>
                  Use Farcaster
                </button>
              )}

              {/* Divider + manual entry — always visible */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                <div className="relative flex justify-center"><span className="px-4 text-[#5c6880] text-xs" style={{ background: 'linear-gradient(135deg, #080d1a 0%, #060b1a 100%)' }}>or enter your handle</span></div>
              </div>

              {/* Manual username form */}
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="flex items-center rounded-xl overflow-hidden border border-white/[0.08] focus-within:border-[#0052FF]/40 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="pl-4 text-white/25 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="username"
                    className="w-full bg-transparent text-white text-sm py-3 px-2 outline-none placeholder:text-white/15"
                    autoFocus={xOauthFailed}
                    maxLength={30}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0039b3] transition-all text-sm glow-sm"
                >
                  Continue with @{username || 'username'}
                </button>
              </form>

              {error && <p className="text-red-400/80 text-xs mt-2">{error}</p>}

              <p className="text-white/15 text-[11px] mt-4 leading-relaxed">
                We only see your public X profile. No passwords, no DMs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
