'use client';
// Premium Coinbase-inspired mosaic canvas — breathing glow, floating particles, soft aesthetic

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

export default function MosaicCanvas({ pixels, onPixelClick }: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const transformRef = useRef({ x: 0, y: 0, scale: 4 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoveredRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

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

  const draw = useCallback((timestamp?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (timestamp !== undefined) timeRef.current = timestamp;
    const t = timeRef.current * 0.001;

    const { x: panX, y: panY, scale } = transformRef.current;
    const container = containerRef.current;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(dpr, dpr);
    }

    const w = container?.clientWidth || 400;
    const h = container?.clientHeight || 400;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const centerX = w / 2;
    const centerY = h / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-GRID_PX / 2 + panX / scale, -GRID_PX / 2 + panY / scale);

    // Background
    ctx.fillStyle = '#080b1a';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Breathing blue glow
    const breatheIntensity = 0.08 + Math.sin(t * 0.8) * 0.04;
    const glow1 = ctx.createRadialGradient(GRID_PX / 2, GRID_PX / 2, 140, GRID_PX / 2, GRID_PX / 2, 380);
    glow1.addColorStop(0, `rgba(0, 82, 255, ${breatheIntensity + 0.06})`);
    glow1.addColorStop(0.5, `rgba(0, 82, 255, ${breatheIntensity * 0.5})`);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Scatter particles (very subtle)
    for (const [px, py] of SCATTER_PIXELS) {
      const hashX = ((px * 374761393 + py * 668265263) & 0x7fffffff) / 0x7fffffff;
      const offsetX = (hashX - 0.5) * 3;
      const alpha = 0.04 + hashX * 0.08 + Math.sin(t * 1.5 + px * 0.1) * 0.02;
      ctx.fillStyle = `rgba(0, 82, 255, ${alpha})`;
      ctx.fillRect(px * CELL_SIZE + offsetX, py * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    // C logo pixels
    for (const [px, py] of LOGO_PIXELS) {
      const key = `${px},${py}`;
      const pixel = pixels.get(key);
      const rx = px * CELL_SIZE;
      const ry = py * CELL_SIZE;
      const hovered = hoveredRef.current?.x === px && hoveredRef.current?.y === py;

      if (pixel?.profile_pic_url) {
        const img = imageCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          ctx.save();
          const cx = rx + CELL_SIZE / 2, cy = ry + CELL_SIZE / 2, cr = CELL_SIZE / 2 - 0.5;
          ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(img, rx, ry, CELL_SIZE, CELL_SIZE);
          if (hovered) {
            ctx.beginPath(); ctx.arc(cx, cy, cr + 1, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 130, 255, 0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#0a1228';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          if (pixel.profile_pic_url) loadImage(pixel.profile_pic_url).then(() => draw());
        }
      } else {
        // Unclaimed — soft blue square
        ctx.fillStyle = '#0a1228';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.strokeStyle = 'rgba(0, 82, 255, 0.1)';
        ctx.lineWidth = 0.4;
        ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        if (hovered) {
          ctx.fillStyle = 'rgba(0, 82, 255, 0.25)';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(GRID_PX / 2, GRID_PX / 2, 42 * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);

    // Continue animation loop for breathing glow
    animationFrameRef.current = requestAnimationFrame(draw);
  }, [pixels, loadImage]);

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, scale } = transformRef.current;
    const gx = Math.floor((clientX - rect.left - rect.width / 2) / scale + GRID_PX / 2 - panX / scale);
    const gy = Math.floor((clientY - rect.top - rect.height / 2) / scale + GRID_PX / 2 - panY / scale);
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) return { x: gx, y: gy };
    return null;
  }, []);

  const updateZoom = (newScale: number) => {
    transformRef.current.scale = Math.min(15, Math.max(1.5, newScale));
    setZoomLevel(Math.round((transformRef.current.scale / 4) * 100));
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

    const handleWheel = (e: WheelEvent) => { e.preventDefault(); updateZoom(transformRef.current.scale * (e.deltaY > 0 ? 0.9 : 1.1)); };
    const handleDown = (e: MouseEvent) => { dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: transformRef.current.x, panY: transformRef.current.y }; };
    const handleMove = (e: MouseEvent) => {
      const pos = screenToGrid(e.clientX, e.clientY);
      hoveredRef.current = (pos && isLogoPixel(pos.x, pos.y)) ? { x: pos.x, y: pos.y } : null;
      if (!dragRef.current.active) return;
      transformRef.current.x = dragRef.current.panX + (e.clientX - dragRef.current.startX);
      transformRef.current.y = dragRef.current.panY + (e.clientY - dragRef.current.startY);
    };
    const handleUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = Math.abs(e.clientX - dragRef.current.startX), dy = Math.abs(e.clientY - dragRef.current.startY);
      dragRef.current.active = false;
      if (dx < 3 && dy < 3) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) onPixelClick(pos.x, pos.y, !!pixels.get(`${pos.x},${pos.y}`));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; hoveredRef.current = null; });

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [draw, screenToGrid, pixels, onPixelClick]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-[20px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Zoom controls — right side */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        {[
          { label: '+', action: () => updateZoom(transformRef.current.scale + 1) },
          { label: `${zoomLevel}%`, action: undefined, display: true },
          { label: '−', action: () => updateZoom(transformRef.current.scale - 1) },
          { label: '⊡', action: () => updateZoom(3) },
        ].map((btn, i) => (
          btn.action ? (
            <button key={i} onClick={btn.action}
              className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/70 text-[10px] rounded-md transition-colors">
              {btn.label}
            </button>
          ) : (
            <span key={i} className="text-white/20 text-[9px] text-center py-1">{btn.label}</span>
          )
        ))}
      </div>

      {/* Drag hint */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080b1a]/80 z-20">
          <div className="text-white/30 text-xs animate-pulse">Loading...</div>
        </div>
      )}
      {!loading && (
        <div className="absolute bottom-3 left-3 text-white/15 text-[10px] pointer-events-none z-10">
          Drag • Scroll
        </div>
      )}
    </div>
  );
}
