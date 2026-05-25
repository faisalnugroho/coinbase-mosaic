'use client';

import { useState } from 'react';
import { UserData } from './LoginModal';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (message: string) => Promise<void>;
  user: UserData;
  x: number;
  y: number;
}

export default function ClaimModal({ isOpen, onClose, onClaim, user, x, y }: ClaimModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write a message');
      return;
    }
    if (message.length > 100) {
      setError('Message must be 100 characters or less');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onClaim(message.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to claim pixel');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d0e24] border border-[#1a1b3a] rounded-2xl p-8 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl"
        >
          ✕
        </button>

        <h2 className="text-white text-2xl font-bold mb-2">Claim This Pixel</h2>
        <p className="text-white/50 text-sm mb-6">
          Pixel ({x}, {y}) — one pixel per person, forever
        </p>

        {/* User preview */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-[#1a1b3a] rounded-xl">
          <img
            src={user.profile_pic_url}
            alt={user.display_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#0052FF]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
            }}
          />
          <div>
            <div className="text-white font-medium text-sm">{user.display_name}</div>
            <div className="text-white/40 text-xs">@{user.username}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">
              Your message <span className="text-white/30">({message.length}/100)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave your mark on the Coinbase mosaic..."
              className="w-full bg-[#1a1b3a] border border-[#2a2b4a] focus:border-[#0052FF] rounded-xl text-white py-3 px-4 outline-none resize-none h-24 transition-colors"
              maxLength={100}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#0052FF] text-white font-medium hover:bg-[#0045d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Claiming...' : 'Claim Pixel'}
          </button>
        </form>
      </div>
    </div>
  );
}
