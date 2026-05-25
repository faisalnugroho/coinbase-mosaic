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
    <div className="w-full lg:w-[340px] flex-shrink-0 px-4 lg:px-6 py-6 lg:py-8 flex flex-col gap-6">
      {/* Headline — "onchain." in Coinbase blue */}
      <div>
        <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
          Built by you.<br />
          Forever <span className="text-[#0052FF]">onchain.</span>
        </h1>
        <p className="text-white/40 text-sm mt-3 leading-relaxed">
          Each pixel is an X user. Together we build the world&apos;s largest Coinbase community mosaic.
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-green-400 text-xs font-medium uppercase tracking-wider">Live Building</span>
      </div>

      {/* Counter */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="text-5xl font-bold text-white tabular-nums tracking-tight">
          {claimedCount.toLocaleString()}
        </div>
        <div className="text-white/30 text-xs mt-1">of {TOTAL_LOGO_PIXELS.toLocaleString()} pixels claimed</div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0052FF] rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,82,255,0.4)]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between mt-3 text-xs">
          <div>
            <span className="text-white/60">Claimed</span>
            <span className="text-white font-medium ml-1">{claimedCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-white/60">Remaining</span>
            <span className="text-white font-medium ml-1">{remaining.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-white/60">Last</span>
            <span className="text-white font-medium ml-1">{lastClaimedAt || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      {!user && (
        <button
          onClick={onConnectClick}
          className="w-full bg-[#0052FF] text-white font-semibold py-4 px-6 rounded-2xl hover:bg-[#0045d9] transition-all shadow-lg shadow-[#0052FF]/20 text-sm"
        >
          Connect X to claim your pixel
        </button>
      )}

      {user && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
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
            <div className="text-white/40 text-xs truncate">@{user.username}</div>
          </div>
          <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded-full">Claimed ✓</span>
        </div>
      )}

      {/* Fine print */}
      <p className="text-white/20 text-xs leading-relaxed">
        One X account = One pixel.<br />Permanent. Non-transferable.
      </p>
    </div>
  );
}
