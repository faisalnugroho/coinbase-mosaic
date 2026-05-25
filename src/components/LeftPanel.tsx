'use client';
// Rebuilt 1:1 from uploaded image

import { TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';

interface LeftPanelProps {
  claimedCount: number;
  lastClaimedAt: string | null;
  user: any;
  onConnectClick: () => void;
}

export default function LeftPanel({ claimedCount, lastClaimedAt, user, onConnectClick }: LeftPanelProps) {
  const remaining = TOTAL_LOGO_PIXELS - claimedCount;
  const pct = TOTAL_LOGO_PIXELS > 0 ? Math.round((claimedCount / TOTAL_LOGO_PIXELS) * 100) : 0;

  return (
    <div className="w-[320px] flex-shrink-0 px-5 py-8 flex flex-col gap-6">
      {/* Headline */}
      <div>
        <h1 className="text-white text-[42px] font-bold leading-[1.1] tracking-[-0.02em]">
          Built by you.
        </h1>
        <h1 className="text-white text-[42px] font-bold leading-[1.1] tracking-[-0.02em]">
          Forever
        </h1>
        <h1 className="text-[#0052FF] text-[42px] font-bold leading-[1.1] tracking-[-0.02em]">
          onchain.
        </h1>
        <p className="text-[#8a8a8a] text-[14px] mt-3 leading-relaxed max-w-[280px]">
          Each pixel is an X user. Together we build the world&apos;s largest Coinbase community mosaic.
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D395] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D395]"></span>
        </span>
        <span className="text-[#00D395] text-[11px] font-semibold uppercase tracking-[0.12em]">Live Building</span>
      </div>

      {/* Counter */}
      <div className="bg-[#111111] border border-[#1a1a2e] rounded-2xl p-5">
        <div className="text-white text-[48px] font-bold tabular-nums leading-none tracking-[-0.02em]">
          {claimedCount.toLocaleString()}
        </div>
        <div className="text-[#8a8a8a] text-[13px] mt-1">of {TOTAL_LOGO_PIXELS.toLocaleString()} pixels claimed</div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0052FF] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,82,255,0.5)]"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <div className="text-white text-[15px] font-bold tabular-nums">{claimedCount.toLocaleString()}</div>
            <div className="text-[#8a8a8a] text-[11px] mt-0.5">Claimed</div>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <div className="text-white text-[15px] font-bold tabular-nums">{remaining.toLocaleString()}</div>
            <div className="text-[#8a8a8a] text-[11px] mt-0.5">Remaining</div>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <div className="text-white text-[15px] font-bold tabular-nums">{lastClaimedAt || '--:--'}</div>
            <div className="text-[#8a8a8a] text-[11px] mt-0.5">Last</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      {!user && (
        <button
          onClick={onConnectClick}
          className="w-full bg-[#0052FF] text-white font-semibold py-[14px] px-5 rounded-2xl hover:bg-[#0045d9] transition-all shadow-[0_0_20px_rgba(0,82,255,0.3)] text-[14px] flex items-center justify-center gap-2"
        >
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Connect X to claim your pixel
        </button>
      )}

      {user && (
        <div className="bg-[#111111] border border-[#1a1a2e] rounded-2xl p-4 flex items-center gap-3">
          <img
            src={user.profile_pic_url}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#0052FF]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.display_name}</div>
            <div className="text-[#8a8a8a] text-xs truncate">@{user.username}</div>
          </div>
          <span className="text-[#00D395] text-[11px] font-semibold bg-[#00D395]/10 px-2 py-0.5 rounded-full">Claimed ✓</span>
        </div>
      )}

      {/* Fine print */}
      <p className="text-[#8a8a8a]/40 text-[12px] leading-relaxed">
        One X account = One pixel.<br />Permanent. Non-transferable.
      </p>
    </div>
  );
}
