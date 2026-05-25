'use client';

import { shareToX } from '@/lib/utils';
import { shareToFarcaster } from '@/lib/farcaster';

interface ShareButtonProps {
  url: string;
  message: string;
  userMessage: string;
}

export default function ShareButton({ url, message, userMessage }: ShareButtonProps) {
  const shareText = `I just claimed my pixel on the Coinbase Community Mosaic Wall! 🟦\n\n"${userMessage}"\n\nJoin me and claim yours:`;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => shareToX(url, shareText)}
        className="flex items-center gap-2 bg-white text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </button>
      <button
        onClick={() => shareToFarcaster(url, shareText)}
        className="flex items-center gap-2 bg-[#8A63D2] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#7B52C1] transition-colors text-sm"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l2.5 8.5L12 22l7.5-6.5L22 7z"/>
        </svg>
        Share on Farcaster
      </button>
    </div>
  );
}
