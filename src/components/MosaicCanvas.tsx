'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS } from '@/lib/logo-mask';

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
  const [zoomLevel, setZoomLevel] = useState(5);
  const [showHint, setShowHint] = useState(true);

  const transformRef = useRef({ x: 0, y: 0, scale: 5 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

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

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Non-logo area
    ctx.fillStyle = '#0d0d0d';
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        if (!isLogoPixel(x, y)) {
          ctx.fillRect(x * CELL_SIZE + 0.5, y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Draw logo pixels
    for (const [px, py] of LOGO_PIXELS) {
      const key = `${px},${py}`;
      const pixel = pixels.get(key);
      const rx = px * CELL_SIZE;
      const ry = py * CELL_SIZE;

      if (pixel?.profile_pic_url) {
        const img = imageCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, rx, ry, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = '#002b80';
          ctx.fillRect(rx, ry, CELL_SIZE, CELL_SIZE);
          if (pixel.profile_pic_url) {
            loadImage(pixel.profile_pic_url).then(() => draw());
          }
        }
      } else {
        // Unclaimed: dark blue
        ctx.fillStyle = '#003399';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }

    // Subtle grid lines
    if (scale > 3) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.2;
      for (let i = 0; i <= 100; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, GRID_PX); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(GRID_PX, i * CELL_SIZE); ctx.stroke();
      }
    }

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
    setZoomLevel(Math.round(transformRef.current.scale));
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
      if (!dragRef.current.active) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          onPixelHover(pos.x, pos.y, pixels.get(`${pos.x},${pos.y}`) || null, e.clientX, e.clientY);
        }
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
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; });
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

      {/* Drag to explore hint */}
      {showHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-full px-5 py-2.5 text-white/40 text-xs flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Drag to explore • Scroll to zoom
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/[0.08] rounded-xl p-1.5">
        <button
          onClick={() => updateZoom(transformRef.current.scale - 1)}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors text-lg"
        >
          −
        </button>
        <span className="text-white/60 text-xs min-w-[3rem] text-center tabular-nums">{zoomLevel}×</span>
        <button
          onClick={() => updateZoom(transformRef.current.scale + 1)}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors text-lg"
        >
          +
        </button>
        <div className="w-px h-5 bg-white/[0.08] mx-1" />
        <button
          onClick={fitToScreen}
          className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors text-xs font-medium"
          title="Fit to screen"
        >
          ⊡
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80">
          <div className="text-white/40 text-sm animate-pulse">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
