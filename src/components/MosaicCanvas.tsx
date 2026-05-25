'use client';
// Rebuilt 1:1 from uploaded image
// MosaicCanvas — scatter/grunge Coinbase C logo with blue glow

import { useRef, useEffect, useState, useCallback } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, isScatterPixelFunc, LOGO_PIXELS, SCATTER_PIXELS } from '@/lib/logo-mask';

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

    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Blue glow aura behind the C (radial gradient)
    const gradient = ctx.createRadialGradient(
      GRID_PX / 2, GRID_PX / 2, 180,
      GRID_PX / 2, GRID_PX / 2, 420
    );
    gradient.addColorStop(0, 'rgba(0, 82, 255, 0.12)');
    gradient.addColorStop(0.4, 'rgba(0, 82, 255, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Second tighter glow
    const glow2 = ctx.createRadialGradient(
      GRID_PX / 2, GRID_PX / 2, 160,
      GRID_PX / 2, GRID_PX / 2, 340
    );
    glow2.addColorStop(0, 'rgba(0, 82, 255, 0.18)');
    glow2.addColorStop(0.5, 'rgba(0, 82, 255, 0.05)');
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Draw scatter pixels first (behind the C)
    for (const [px, py] of SCATTER_PIXELS) {
      // Deterministic offset for scatter/grunge effect
      const hashX = ((px * 374761393 + py * 668265263) & 0x7fffffff) / 0x7fffffff;
      const hashY = ((px * 4372891 + py * 982451653) & 0x7fffffff) / 0x7fffffff;
      const offsetX = (hashX - 0.5) * 3.5;
      const offsetY = (hashY - 0.5) * 3.5;
      const alpha = 0.15 + hashX * 0.25;

      ctx.fillStyle = `rgba(0, 52, 153, ${alpha})`;
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

      if (pixel?.profile_pic_url) {
        // Claimed pixel — draw profile photo
        const img = imageCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          // Slight rounded clip for profile photos
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1, 1.5);
          ctx.clip();
          ctx.drawImage(img, rx, ry, CELL_SIZE, CELL_SIZE);
          ctx.restore();
        } else {
          // Photo loading — show placeholder
          ctx.fillStyle = '#002b80';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          if (pixel.profile_pic_url) {
            loadImage(pixel.profile_pic_url).then(() => draw());
          }
        }
      } else {
        // Unclaimed — bright white/blue to make the C visible
        const dx = px - 49.5;
        const dy = py - 49.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Brighter near the edge of the C (makes it pop against scatter)
        const brightnessFactor = Math.min(1, (dist / 38) * 1.2);
        const r = Math.floor(0 + brightnessFactor * 0);
        const g = Math.floor(60 + brightnessFactor * 80);
        const b = Math.floor(180 + brightnessFactor * 75);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        // Subtle inner highlight on each unclaimed pixel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(rx + 1, ry + 1, CELL_SIZE - 2, 1);
      }
    }

    // Subtle grid lines on C pixels only (at high zoom)
    if (scale > 4) {
      ctx.strokeStyle = 'rgba(0, 82, 255, 0.08)';
      ctx.lineWidth = 0.15;
      for (const [gx, gy] of LOGO_PIXELS) {
        ctx.strokeRect(gx * CELL_SIZE + 0.5, gy * CELL_SIZE + 0.5, CELL_SIZE, CELL_SIZE);
      }
    }

    // Outer ring glow outline
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.2)';
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

      {/* Drag hint */}
      {showHint && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-full px-5 py-2.5 text-white/40 text-xs flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Drag to explore • Scroll to zoom
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/[0.08] rounded-xl p-1.5 z-10">
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-20">
          <div className="text-white/40 text-sm animate-pulse">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
