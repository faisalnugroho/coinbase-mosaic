'use client';
// Rebuilt 1:1 from uploaded image

import { Pixel } from '@/lib/supabase';
import { shareToX } from '@/lib/utils';

interface RightPanelProps {
  pixel: Pixel;
  x: number;
  y: number;
  onClose: () => void;
}

export default function RightPanel({ pixel, x, y, onClose }: RightPanelProps) {
  if (!pixel) return null;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = `I claimed my pixel on the Coinbase Community Mosaic Wall! 🟦\n\n"${pixel.message || ''}"\n\nJoin me:`;

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-[#1a1a2e] bg-[#0a0a0a]/70 backdrop-blur-sm animate-slide-in">
      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[#8a8a8a] text-[11px] uppercase tracking-[0.1em] font-medium">Pixel</div>
            <div className="text-white font-mono text-[13px] mt-0.5">({x}, {y})</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00D395] text-[11px] font-semibold bg-[#00D395]/10 px-2 py-0.5 rounded-full">
              Claimed
            </span>
            <button onClick={onClose} className="text-[#8a8a8a] hover:text-white text-lg transition-colors leading-none">✕</button>
          </div>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-[#1a1a2e]">
          <div className="relative mb-4">
            <img
              src={pixel.profile_pic_url || ''}
              alt={pixel.username || ''}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[#0052FF]/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
              }}
            />
            <div className="absolute inset-0 rounded-full blur-lg bg-[#0052FF]/15 -z-10" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-[15px]">{pixel.display_name}</span>
            {/* Blue verified check */}
            <svg className="w-[15px] h-[15px] text-[#0052FF]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-[#8a8a8a] text-[13px] mt-0.5">@{pixel.username}</span>
        </div>

        {/* Message */}
        {pixel.message && (
          <div className="py-5 border-b border-[#1a1a2e]">
            <p className="text-[#8a8a8a] text-[13px] leading-relaxed italic text-center">
              &ldquo;{pixel.message}&rdquo;
            </p>
          </div>
        )}

        {/* Timestamp */}
        {pixel.claimed_at && (
          <div className="py-4 border-b border-[#1a1a2e] text-center">
            <span className="text-[#8a8a8a] text-[12px]">
              Claimed {new Date(pixel.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' '}at{' '}
              {new Date(pixel.claimed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-auto pt-5">
          <a
            href={`https://x.com/${pixel.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#1a1a2e] border border-[#1a1a2e] rounded-xl py-[11px] text-[#8a8a8a] hover:text-white text-[13px] transition-colors"
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            View on X
          </a>
          <button
            onClick={() => shareToX(siteUrl, shareText)}
            className="flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0045d9] rounded-xl py-[11px] text-white text-[13px] font-medium transition-colors shadow-[0_0_12px_rgba(0,82,255,0.25)]"
          >
            <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
