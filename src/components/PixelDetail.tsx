'use client';

import { Pixel } from '@/lib/supabase';

interface PixelDetailProps {
  x: number;
  y: number;
  pixel: Pixel | null;
  isVisible: boolean;
  mouseX: number;
  mouseY: number;
}

export default function PixelDetail({ x, y, pixel, isVisible, mouseX, mouseY }: PixelDetailProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{
        left: mouseX + 16,
        top: mouseY + 16,
        maxWidth: 280,
      }}
    >
      <div className="bg-[#0d0e24] border border-[#2a2b4a] rounded-xl p-4 shadow-2xl">
        {pixel ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={pixel.profile_pic_url || ''}
                alt={pixel.username || ''}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0052FF]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>';
                }}
              />
              <div>
                <div className="text-white font-medium text-sm">{pixel.display_name}</div>
                <div className="text-white/40 text-xs">@{pixel.username}</div>
              </div>
            </div>
            {pixel.message && (
              <p className="text-white/70 text-sm italic leading-relaxed">
                &ldquo;{pixel.message}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-white/60 text-sm">Empty pixel ({x}, {y})</p>
            <p className="text-[#0052FF] text-xs mt-1">Click to claim!</p>
          </div>
        )}
      </div>
    </div>
  );
}
