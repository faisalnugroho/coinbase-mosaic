'use client';
// Premium mosaic canvas — cinematic lighting, inertia zoom/pan, breathing glow

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

  const transformRef = useRef({ x: 0, y: 0, scale: 4, targetScale: 4 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  // Inertia
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const inertiaRef = useRef<number>(0);

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

  // Smooth zoom interpolation
  const animateZoom = useCallback(() => {
    const diff = transformRef.current.targetScale - transformRef.current.scale;
    if (Math.abs(diff) < 0.005) {
      transformRef.current.scale = transformRef.current.targetScale;
      return;
    }
    transformRef.current.scale += diff * 0.15;
    setZoomLevel(Math.round((transformRef.current.scale / 4) * 100));
  }, []);

  const draw = useCallback((timestamp?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (timestamp !== undefined) timeRef.current = timestamp;
    const t = timeRef.current * 0.001;

    // Apply inertia
    if (!dragRef.current.active) {
      const friction = 0.92;
      velocityRef.current.x *= friction;
      velocityRef.current.y *= friction;
      if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
        transformRef.current.x += velocityRef.current.x;
        transformRef.current.y += velocityRef.current.y;
      } else {
        velocityRef.current.x = 0;
        velocityRef.current.y = 0;
      }
    }

    // Smooth zoom
    animateZoom();

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

    // Breathing cinematic glow
    const breathe = 0.06 + Math.sin(t * 0.7) * 0.035;
    const glow1 = ctx.createRadialGradient(GRID_PX / 2, GRID_PX / 2, 130, GRID_PX / 2, GRID_PX / 2, 400);
    glow1.addColorStop(0, `rgba(0, 82, 255, ${breathe + 0.08})`);
    glow1.addColorStop(0.4, `rgba(0, 82, 255, ${breathe * 0.6})`);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Inner spotlight
    const spot = ctx.createRadialGradient(GRID_PX / 2, GRID_PX / 2, 100, GRID_PX / 2, GRID_PX / 2, 300);
    spot.addColorStop(0, `rgba(0, 82, 255, ${breathe + 0.04})`);
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Scatter pixels
    for (const [px, py] of SCATTER_PIXELS) {
      const hashX = ((px * 374761393 + py * 668265263) & 0x7fffffff) / 0x7fffffff;
      const offsetX = (hashX - 0.5) * 3.5;
      const alpha = 0.03 + hashX * 0.06 + Math.sin(t * 1.3 + px * 0.08) * 0.015;
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
            ctx.beginPath(); ctx.arc(cx, cy, cr + 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 130, 255, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowColor = 'rgba(0, 130, 255, 0.6)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#0a1226';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          if (pixel.profile_pic_url) loadImage(pixel.profile_pic_url).then(() => draw());
        }
      } else {
        // Unclaimed — clean dark blue square
        ctx.fillStyle = '#0a1226';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.strokeStyle = 'rgba(0, 82, 255, 0.08)';
        ctx.lineWidth = 0.35;
        ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        if (hovered) {
          ctx.fillStyle = 'rgba(0, 82, 255, 0.3)';
          ctx.fillRect(rx - 0.5, ry - 0.5, CELL_SIZE + 1, CELL_SIZE + 1);
          ctx.shadowColor = 'rgba(0, 130, 255, 0.5)'; ctx.shadowBlur = 6;
          ctx.fillRect(rx - 0.5, ry - 0.5, CELL_SIZE + 1, CELL_SIZE + 1);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 82, 255, 0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(GRID_PX / 2, GRID_PX / 2, 42 * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [pixels, loadImage, animateZoom]);

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, scale } = transformRef.current;
    const gx = Math.floor((clientX - rect.left - rect.width / 2) / scale + GRID_PX / 2 - panX / scale);
    const gy = Math.floor((clientY - rect.top - rect.height / 2) / scale + GRID_PX / 2 - panY / scale);
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) return { x: gx, y: gy };
    return null;
  }, []);

  const setZoom = useCallback((newScale: number) => {
    transformRef.current.targetScale = Math.min(15, Math.max(1.5, newScale));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

    const handleWheel = (e: WheelEvent) => { e.preventDefault(); setZoom(transformRef.current.targetScale * (e.deltaY > 0 ? 0.88 : 1.13)); };
    const handleDown = (e: MouseEvent) => {
      velocityRef.current = { x: 0, y: 0 };
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: transformRef.current.x, panY: transformRef.current.y };
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    };
    const handleMove = (e: MouseEvent) => {
      const pos = screenToGrid(e.clientX, e.clientY);
      hoveredRef.current = (pos && isLogoPixel(pos.x, pos.y)) ? { x: pos.x, y: pos.y } : null;

      if (!dragRef.current.active) return;
      const now = performance.now();
      if (now - lastMoveRef.current.time > 10) {
        velocityRef.current = {
          x: e.clientX - lastMoveRef.current.x,
          y: e.clientY - lastMoveRef.current.y,
        };
        lastMoveRef.current = { x: e.clientX, y: e.clientY, time: now };
      }
      transformRef.current.x = dragRef.current.panX + (e.clientX - dragRef.current.startX);
      transformRef.current.y = dragRef.current.panY + (e.clientY - dragRef.current.startY);
    };
    const handleUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = Math.abs(e.clientX - dragRef.current.startX), dy = Math.abs(e.clientY - dragRef.current.startY);
      dragRef.current.active = false;
      if (dx < 3 && dy < 3) {
        velocityRef.current = { x: 0, y: 0 };
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) onPixelClick(pos.x, pos.y, !!pixels.get(`${pos.x},${pos.y}`));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; hoveredRef.current = null; });

    // Touch events
    let touchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        touchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        if (touchDist > 0) setZoom(transformRef.current.targetScale * (newDist / touchDist));
        touchDist = newDist;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [draw, screenToGrid, pixels, onPixelClick, setZoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-[22px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Zoom controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
        {[
          { label: '+', action: () => setZoom(transformRef.current.targetScale + 1.2) },
          { label: `${zoomLevel}%`, display: true },
          { label: '−', action: () => setZoom(transformRef.current.targetScale - 1.2) },
          { label: '⊡', action: () => { transformRef.current.targetScale = 3; transformRef.current.x = 0; transformRef.current.y = 0; } },
        ].map((btn, i) =>
          btn.action ? (
            <button key={i} onClick={btn.action} className="w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/60 text-[10px] rounded-md transition-colors">
              {btn.label}
            </button>
          ) : (
            <span key={i} className="text-white/15 text-[9px] text-center font-medium py-1">{btn.label}</span>
          )
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080b1a]/85 z-20">
          <div className="text-white/25 text-xs">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
