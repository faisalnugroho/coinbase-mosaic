'use client';
// Rebuilt 1:1 from uploaded image

import { useRef, useEffect, useState, useCallback } from 'react';
import { Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS, SCATTER_PIXELS } from '@/lib/logo-mask';

interface MosaicCanvasProps {
  pixels: Map<string, Pixel>;
  onPixelClick: (x: number, y: number, claimed: boolean) => void;
  onPixelHover: (x: number, y: number, pixel: Pixel | null, clientX: number, clientY: number) => void;
}

const CELL_SIZE = 8;
const GRID_PX = CELL_SIZE * 100;

export default function MosaicCanvas({ pixels, onPixelClick, onPixelHover }: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showHint, setShowHint] = useState(true);

  const transformRef = useRef({ x: 0, y: 0, scale: 5 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoveredPixel = useRef<{ x: number; y: number } | null>(null);

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(url);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.current.set(url, img); resolve(img); };
      img.onerror = () => resolve(img);
      img.src = url;
    });
  }, []);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: panX, y: panY, scale } = transformRef.current;
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    const w = container?.clientWidth || 800;
    const h = container?.clientHeight || 600;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const centerX = w / 2;
    const centerY = h / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-GRID_PX / 2 + panX / scale, -GRID_PX / 2 + panY / scale);

    // Black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Outer blue glow aura
    const glow1 = ctx.createRadialGradient(
      GRID_PX / 2, GRID_PX / 2, 160,
      GRID_PX / 2, GRID_PX / 2, 420
    );
    glow1.addColorStop(0, 'rgba(0, 82, 255, 0.10)');
    glow1.addColorStop(0.5, 'rgba(0, 82, 255, 0.03)');
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Inner tighter glow
    const glow2 = ctx.createRadialGradient(
      GRID_PX / 2, GRID_PX / 2, 140,
      GRID_PX / 2, GRID_PX / 2, 340
    );
    glow2.addColorStop(0, 'rgba(0, 82, 255, 0.15)');
    glow2.addColorStop(0.6, 'rgba(0, 82, 255, 0.04)');
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Draw scatter/grunge pixels behind the C
    for (const [px, py] of SCATTER_PIXELS) {
      const hashX = ((px * 374761393 + py * 668265263) & 0x7fffffff) / 0x7fffffff;
      const hashY = ((px * 4372891 + py * 982451653) & 0x7fffffff) / 0x7fffffff;
      const offsetX = (hashX - 0.5) * 3.5;
      const offsetY = (hashY - 0.5) * 3.5;
      const alpha = 0.10 + hashX * 0.20;

      ctx.fillStyle = `rgba(0, 40, 120, ${alpha})`;
      ctx.fillRect(
        px * CELL_SIZE + offsetX + 0.5,
        py * CELL_SIZE + offsetY + 0.5,
        CELL_SIZE - 1.5,
        CELL_SIZE - 1.5
      );
    }

    // Draw C logo pixels
    for (const [px, py] of LOGO_PIXELS) {
      const key = `${px},${py}`;
      const pixel = pixels.get(key);
      const rx = px * CELL_SIZE;
      const ry = py * CELL_SIZE;
      const isHovered = hoveredPixel.current?.x === px && hoveredPixel.current?.y === py;

      if (pixel?.profile_pic_url) {
        // Claimed pixel — circular profile photo
        const img = imageCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          ctx.save();
          // Circular clip
          ctx.beginPath();
          const cx = rx + CELL_SIZE / 2;
          const cy = ry + CELL_SIZE / 2;
          const cr = CELL_SIZE / 2 - 0.5;
          ctx.arc(cx, cy, cr, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, rx, ry, CELL_SIZE, CELL_SIZE);

          // Hover glow on claimed
          if (isHovered) {
            ctx.beginPath();
            ctx.arc(cx, cy, cr + 1, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 130, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.shadowColor = 'rgba(0, 130, 255, 0.6)';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        } else {
          // Loading placeholder
          ctx.fillStyle = '#0a1628';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          if (pixel.profile_pic_url) {
            loadImage(pixel.profile_pic_url).then(() => draw());
          }
        }
      } else {
        // Unclaimed — dark blue with subtle border
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.strokeStyle = 'rgba(0, 82, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        // Hover glow on unclaimed
        if (isHovered) {
          ctx.fillStyle = 'rgba(0, 82, 255, 0.3)';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          ctx.strokeStyle = 'rgba(0, 130, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Subtle grid lines at high zoom
    if (scale > 4) {
      ctx.strokeStyle = 'rgba(0, 82, 255, 0.06)';
      ctx.lineWidth = 0.15;
      for (const [gx, gy] of LOGO_PIXELS) {
        ctx.strokeRect(gx * CELL_SIZE + 0.5, gy * CELL_SIZE + 0.5, CELL_SIZE, CELL_SIZE);
      }
    }

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(GRID_PX / 2, GRID_PX / 2, 42 * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);
  }, [pixels, loadImage]);

  const screenToGrid = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, scale } = transformRef.current;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const screenX = clientX - rect.left - centerX;
    const screenY = clientY - rect.top - centerY;
    const worldX = screenX / scale + GRID_PX / 2 - panX / scale;
    const worldY = screenY / scale + GRID_PX / 2 - panY / scale;
    const gx = Math.floor(worldX / CELL_SIZE);
    const gy = Math.floor(worldY / CELL_SIZE);
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) return { x: gx, y: gy };
    return null;
  }, []);

  const updateZoom = (newScale: number) => {
    transformRef.current.scale = Math.min(15, Math.max(1, newScale));
    setZoomLevel(Math.round((transformRef.current.scale / 5) * 100));
    draw();
  };

  // Mouse/touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.85 : 1.15;
      updateZoom(transformRef.current.scale * delta);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setShowHint(false);
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: transformRef.current.x, panY: transformRef.current.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = screenToGrid(e.clientX, e.clientY);
      if (!dragRef.current.active) {
        if (pos && isLogoPixel(pos.x, pos.y)) {
          hoveredPixel.current = { x: pos.x, y: pos.y };
          onPixelHover(pos.x, pos.y, pixels.get(`${pos.x},${pos.y}`) || null, e.clientX, e.clientY);
        } else {
          hoveredPixel.current = null;
        }
        draw();
        return;
      }
      transformRef.current.x = dragRef.current.panX + (e.clientX - dragRef.current.startX);
      transformRef.current.y = dragRef.current.panY + (e.clientY - dragRef.current.startY);
      draw();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);
      dragRef.current.active = false;
      if (dx < 3 && dy < 3) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          onPixelClick(pos.x, pos.y, !!pixels.get(`${pos.x},${pos.y}`));
        }
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; hoveredPixel.current = null; draw(); });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draw, screenToGrid, pixels, onPixelClick, onPixelHover]);

  useEffect(() => { draw(); }, [draw]);

  const fitToScreen = () => updateZoom(3);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Drag hint — top left */}
      {showHint && (
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <div className="bg-[#111111]/90 backdrop-blur-sm border border-[#1a1a2e] rounded-lg px-4 py-2.5 text-[#8a8a8a] text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
            </svg>
            Drag to explore • Scroll to zoom
          </div>
        </div>
      )}

      {/* Zoom controls — bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0.5 bg-[#111111]/95 backdrop-blur-sm border border-[#1a1a2e] rounded-xl p-1">
          <button
            onClick={() => updateZoom(transformRef.current.scale - 1)}
            className="w-8 h-8 flex items-center justify-center text-[#8a8a8a] hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors text-sm"
          >
            −
          </button>
          <span className="text-[#8a8a8a] text-[12px] min-w-[42px] text-center tabular-nums font-medium">{zoomLevel}%</span>
          <button
            onClick={() => updateZoom(transformRef.current.scale + 1)}
            className="w-8 h-8 flex items-center justify-center text-[#8a8a8a] hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors text-sm"
          >
            +
          </button>
          <div className="w-px h-4 bg-[#1a1a2e] mx-1" />
          <button
            onClick={fitToScreen}
            className="w-8 h-8 flex items-center justify-center text-[#8a8a8a] hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors text-[11px] font-medium"
            title="Fit to screen"
          >
            ⊡
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-20">
          <div className="text-[#8a8a8a] text-sm animate-pulse">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
