'use client';
// Visible mosaic — full blue pixel circle with bold white C overlay

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

// C logo shape constants (for overlay drawing)
const CX = 49.5, CY = 49.5;
const C_OUTER = 42, C_INNER = 22;
const C_GAP_START = -Math.PI / 5.5;  // ~33° below right
const C_GAP_END = Math.PI / 5.5;     // ~33° above right

export default function MosaicCanvas({ pixels, onPixelClick }: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const transformRef = useRef({ x: 0, y: 0, scale: 4, targetScale: 4 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
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

    // Inertia
    if (!dragRef.current.active) {
      velocityRef.current.x *= 0.92;
      velocityRef.current.y *= 0.92;
      if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
        transformRef.current.x += velocityRef.current.x;
        transformRef.current.y += velocityRef.current.y;
      } else { velocityRef.current.x = 0; velocityRef.current.y = 0; }
    }

    // Smooth zoom
    const diff = transformRef.current.targetScale - transformRef.current.scale;
    if (Math.abs(diff) < 0.005) transformRef.current.scale = transformRef.current.targetScale;
    else transformRef.current.scale += diff * 0.15;
    setZoomLevel(Math.round((transformRef.current.scale / 4) * 100));

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
    const centerX = w / 2, centerY = h / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-GRID_PX / 2 + panX / scale, -GRID_PX / 2 + panY / scale);

    // BACKGROUND — lighten slightly so contrast works
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Breathing glow
    const breathe = 0.10 + Math.sin(t * 0.7) * 0.06;
    const glow1 = ctx.createRadialGradient(GRID_PX / 2, GRID_PX / 2, 120, GRID_PX / 2, GRID_PX / 2, 420);
    glow1.addColorStop(0, `rgba(0, 82, 255, ${breathe + 0.12})`);
    glow1.addColorStop(0.5, `rgba(0, 82, 255, ${breathe * 0.5})`);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Scatter particles
    for (const [px, py] of SCATTER_PIXELS) {
      const hashX = ((px * 374761393 + py * 668265263) & 0x7fffffff) / 0x7fffffff;
      const offsetX = (hashX - 0.5) * 3.5;
      const dist = Math.sqrt((px - 49.5) ** 2 + (py - 49.5) ** 2);
      const fadeIn = Math.max(0, 1 - (dist - 42) / 8);
      const alpha = (0.08 + hashX * 0.14 + Math.sin(t * 1.3 + px * 0.08) * 0.03) * fadeIn;
      ctx.fillStyle = `rgba(0, 82, 255, ${alpha})`;
      ctx.fillRect(px * CELL_SIZE + offsetX, py * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    // === CIRCLE PIXEL FIELD ===
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
            ctx.strokeStyle = 'rgba(0, 180, 255, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#153670';
          ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          ctx.strokeStyle = 'rgba(0, 100, 255, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          if (pixel.profile_pic_url) loadImage(pixel.profile_pic_url).then(() => draw());
        }
      } else {
        // Unclaimed — brighter blue so the circle is clearly visible
        ctx.fillStyle = '#153670';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.25)';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        if (hovered) {
          ctx.fillStyle = 'rgba(0, 130, 255, 0.4)';
          ctx.fillRect(rx - 1, ry - 1, CELL_SIZE + 2, CELL_SIZE + 2);
          ctx.shadowColor = 'rgba(0, 150, 255, 0.6)'; ctx.shadowBlur = 8;
          ctx.fillRect(rx - 1, ry - 1, CELL_SIZE + 2, CELL_SIZE + 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // === WHITE C LOGO OVERLAY ===
    // Draw a bold white C shape on top of the blue pixel field
    ctx.save();
    ctx.globalAlpha = 0.85 + Math.sin(t * 0.7) * 0.08;

    // The C is a thick arc — outer radius 42, inner radius 20
    const thickCWidth = (C_OUTER - C_INNER) * CELL_SIZE;
    const midR = ((C_OUTER + C_INNER) / 2) * CELL_SIZE;
    const cxPx = CX * CELL_SIZE;
    const cyPx = CY * CELL_SIZE;

    // Draw C as a thick stroked arc (clockwise from gap_end to gap_start wrapping around)
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.7)';
    ctx.lineWidth = thickCWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Arc from gap end (right-upper) around counter-clockwise to gap start (right-lower)
    ctx.arc(cxPx, cyPx, midR, C_GAP_END, C_GAP_START + Math.PI * 2, false);
    ctx.stroke();

    // Inner glow on the C
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = thickCWidth * 0.5;
    ctx.beginPath();
    ctx.arc(cxPx, cyPx, midR, C_GAP_END, C_GAP_START + Math.PI * 2, false);
    ctx.stroke();

    ctx.restore();

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 130, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(GRID_PX / 2, GRID_PX / 2, 42 * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);
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
        velocityRef.current = { x: e.clientX - lastMoveRef.current.x, y: e.clientY - lastMoveRef.current.y };
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
    let touchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX, dy = e.touches[1].clientY - e.touches[0].clientY;
        touchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[1].clientX - e.touches[0].clientX, dy = e.touches[1].clientY - e.touches[0].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        if (touchDist > 0) setZoom(transformRef.current.targetScale * (newDist / touchDist));
        touchDist = newDist;
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; hoveredRef.current = null; });
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
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
        {[
          { label: '+', action: () => setZoom(transformRef.current.targetScale + 1.2) },
          { label: `${zoomLevel}%`, display: true },
          { label: '−', action: () => setZoom(transformRef.current.targetScale - 1.2) },
          { label: '⊡', action: () => { transformRef.current.targetScale = 3; transformRef.current.x = 0; transformRef.current.y = 0; } },
        ].map((btn, i) =>
          btn.action ? (
            <button key={i} onClick={btn.action} className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/70 text-[10px] rounded-md transition-colors">{btn.label}</button>
          ) : (
            <span key={i} className="text-white/20 text-[9px] text-center font-medium py-1">{btn.label}</span>
          )
        )}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080b1a]/85 z-20">
          <div className="text-white/30 text-xs">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
