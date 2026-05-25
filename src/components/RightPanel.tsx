'use client';

import { Pixel } from '@/lib/supabase';
import { shareToX } from '@/lib/utils';
import { shareToFarcaster } from '@/lib/farcaster';

interface RightPanelProps {
  pixel: Pixel | null;
  x: number;
  y: number;
  onClose: () => void;
}

export default function RightPanel({ pixel, x, y, onClose }: RightPanelProps) {
  if (!pixel) return null;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = `I claimed my pixel on the Coinbase Community Mosaic Wall! 🟦\n\n"${pixel.message || ''}"\n\nJoin me:`;

  return (
    <div className="w-full lg:w-[340px] flex-shrink-0 border-l border-white/[0.06] bg-[#0a0a0a]/50 backdrop-blur-sm">
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-white/30 text-xs uppercase tracking-wider">Pixel</div>
            <div className="text-white font-mono text-sm">({x}, {y})</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
              Claimed
            </span>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">✕</button>
          </div>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-white/[0.06]">
          <img
            src={pixel.profile_pic_url || ''}
            alt={pixel.username || ''}
            className="w-20 h-20 rounded-full object-cover border-3 border-[#0052FF] mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
            }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-lg">{pixel.display_name}</span>
            <svg className="w-4 h-4 text-[#0052FF]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
          <span className="text-white/40 text-sm">@{pixel.username}</span>
        </div>

        {/* Message */}
        {pixel.message && (
          <div className="py-5 border-b border-white/[0.06]">
            <p className="text-white/80 text-sm leading-relaxed italic text-center">
              &ldquo;{pixel.message}&rdquo;
            </p>
          </div>
        )}

        {/* Timestamp */}
        {pixel.claimed_at && (
          <div className="py-4 border-b border-white/[0.06] text-center">
            <span className="text-white/30 text-xs">
              Claimed {new Date(pixel.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' '}at{' '}
              {new Date(pixel.claimed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-auto pt-6">
          <a
            href={`https://x.com/${pixel.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl py-3 text-white/70 text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            View on X
          </a>
          <button
            onClick={() => shareToX(siteUrl, shareText)}
            className="flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0045d9] rounded-xl py-3 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
