'use client';
// Mosaic canvas — C pixels glow white, fill pixels subtle blue, ripple hover, minimap

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS, C_SHAPE_PIXELS, CIRCLE_FILL_PIXELS, SCATTER_PIXELS, TOTAL_LOGO_PIXELS } from '@/lib/logo-mask';

interface Props {
  pixels: Map<string, Pixel>;
  onPixelClick: (x: number, y: number, claimed: boolean) => void;
  claimedCount: number;
}

const CELL = 8, GRID = CELL * 100;
const CX = 49.5, CY = 49.5, R_OUTER = 42;

// Tooltip type
interface TooltipData { pixel: Pixel; x: number; y: number; screenX: number; screenY: number; }

export default function MosaicCanvas({ pixels, onPixelClick, claimedCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomPct, setZoomPct] = useState(100);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const ripId = useRef(0);

  const tRef = useRef({ x: 0, y: 0, scale: 1.0, targetScale: 1.0 }); // default 50% = scale 1, shows full circle
  const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0, t: 0 });
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const afRef = useRef(0);
  const timeRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number; vx: number; vy: number; a: number; s: number }[]>([]);

  // Precompute all pixel positions as flat arrays for performance
  const allPixels = useMemo(() => LOGO_PIXELS, []);
  const cShapeSet = useMemo(() => new Set(C_SHAPE_PIXELS.map(([x,y]) => `${x},${y}`)), []);

  useEffect(() => {
    for (let i = 0; i < 60; i++) starsRef.current.push({
      x: Math.random() * GRID, y: Math.random() * GRID,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      a: 0.08 + Math.random() * 0.25, s: 0.5 + Math.random() * 1.5,
    });
  }, []);

  const loadImg = useCallback((url: string): Promise<HTMLImageElement> => {
    if (imgCache.current.has(url)) return Promise.resolve(imgCache.current.get(url)!);
    return new Promise(r => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => { imgCache.current.set(url, i); r(i); }; i.onerror = () => r(i); i.src = url; });
  }, []);

  // Draw minimap
  const drawMinimap = useCallback(() => {
    const mc = miniRef.current; if (!mc) return;
    const mctx = mc.getContext('2d'); if (!mctx) return;
    const mw = 120, mh = 120;
    mc.width = mw; mc.height = mh;
    mctx.fillStyle = 'rgba(4,7,15,0.8)'; mctx.fillRect(0, 0, mw, mh);
    mctx.strokeStyle = 'rgba(255,255,255,0.06)'; mctx.lineWidth = 0.5; mctx.strokeRect(0, 0, mw, mh);

    const s = mw / 100;
    // Draw C shape outline
    mctx.strokeStyle = 'rgba(0,130,255,0.3)'; mctx.lineWidth = 1;
    mctx.beginPath(); mctx.arc(CX * s, CY * s, R_OUTER * s, 0, Math.PI * 2); mctx.stroke();

    // Draw claimed dots
    pixels.forEach((_, key) => {
      const [px, py] = key.split(',').map(Number);
      const isC = cShapeSet.has(key);
      mctx.fillStyle = isC ? 'rgba(180,220,255,0.6)' : 'rgba(0,82,255,0.4)';
      mctx.fillRect(px * s + 0.5, py * s + 0.5, s - 1, s - 1);
    });

    // Viewport rect
    const vpW = (mc.parentElement?.clientWidth || 400) / tRef.current.scale / CELL;
    const vpH = (mc.parentElement?.clientHeight || 400) / tRef.current.scale / CELL;
    const vpX = 50 - vpW / 2 - tRef.current.x / (CELL * tRef.current.scale);
    const vpY = 50 - vpH / 2 - tRef.current.y / (CELL * tRef.current.scale);
    mctx.strokeStyle = 'rgba(255,255,255,0.5)'; mctx.lineWidth = 1;
    mctx.strokeRect(vpX * s, vpY * s, vpW * s, vpH * s);
  }, [pixels, cShapeSet]);

  const draw = useCallback((ts?: number) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    if (ts !== undefined) timeRef.current = ts;
    const t = timeRef.current * 0.001;

    // Inertia
    if (!dragRef.current.active) {
      velRef.current.x *= 0.9; velRef.current.y *= 0.9;
      if (Math.abs(velRef.current.x) > 0.05 || Math.abs(velRef.current.y) > 0.05) {
        tRef.current.x += velRef.current.x; tRef.current.y += velRef.current.y;
      } else { velRef.current.x = 0; velRef.current.y = 0; }
    }

    // Smooth zoom
    const diff = tRef.current.targetScale - tRef.current.scale;
    if (Math.abs(diff) < 0.003) tRef.current.scale = tRef.current.targetScale;
    else tRef.current.scale += diff * 0.12;
    setZoomPct(Math.round(tRef.current.scale * 50)); // scale 1 = 50%

    const { x: px, y: py, scale } = tRef.current;
    const cont = containerRef.current; if (!cont) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = cont.clientWidth * dpr; c.height = cont.clientHeight * dpr;
    c.style.width = `${cont.clientWidth}px`; c.style.height = `${cont.clientHeight}px`;
    ctx.scale(dpr, dpr);
    const w = cont.clientWidth, h = cont.clientHeight;

    ctx.clearRect(0, 0, w, h); ctx.save();
    ctx.translate(w / 2, h / 2); ctx.scale(scale, scale);
    ctx.translate(-GRID / 2 + px / scale, -GRID / 2 + py / scale);

    // Space bg
    ctx.fillStyle = '#04070F'; ctx.fillRect(0, 0, GRID, GRID);

    // Stars
    for (const s of starsRef.current) {
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = GRID; if (s.x > GRID) s.x = 0;
      if (s.y < 0) s.y = GRID; if (s.y > GRID) s.y = 0;
      ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Orb glow behind circle
    const br = 0.10 + Math.sin(t * 0.5) * 0.06;
    const glow = ctx.createRadialGradient(GRID / 2, GRID / 2, 120, GRID / 2, GRID / 2, 460);
    glow.addColorStop(0, `rgba(0, 82, 255, ${br + 0.14})`);
    glow.addColorStop(0.4, `rgba(0, 82, 255, ${br * 0.5})`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, GRID, GRID);

    // Scatter
    for (const [sx, sy] of SCATTER_PIXELS) {
      const hx = ((sx * 374761393 + sy * 668265263) & 0x7fffffff) / 0x7fffffff;
      const ox = (hx - 0.5) * 4;
      const d = Math.sqrt((sx - 49.5) ** 2 + (sy - 49.5) ** 2);
      const fi = Math.max(0, 1 - (d - 42) / 8);
      const a = (0.06 + hx * 0.14 + Math.sin(t * 1.2 + sx * 0.08) * 0.03) * fi;
      ctx.fillStyle = `rgba(0, 82, 255, ${a})`;
      ctx.fillRect(sx * CELL + ox, sy * CELL, CELL - 1, CELL - 1);
    }

    // === Draw all logo pixels ===
    for (const [px, py] of allPixels) {
      const key = `${px},${py}`;
      const pixel = pixels.get(key);
      const rx = px * CELL, ry = py * CELL;
      const hov = hoverRef.current?.x === px && hoverRef.current?.y === py;
      const isC = cShapeSet.has(key);

      if (pixel?.profile_pic_url) {
        const img = imgCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          ctx.save();
          const cx = rx + CELL / 2, cy = ry + CELL / 2, cr = CELL / 2 - 0.8;
          // Rounded rect clip
          ctx.beginPath(); ctx.roundRect(rx + 1, ry + 1, CELL - 2, CELL - 2, 1.5); ctx.clip();
          ctx.drawImage(img, rx, ry, CELL, CELL);
          if (hov) {
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.9)'; ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0, 200, 255, 0.6)'; ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        } else {
          ctx.fillStyle = isC ? '#1a2a5a' : '#0d1a35';
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
          if (pixel.profile_pic_url) loadImg(pixel.profile_pic_url).then(() => draw());
        }
      } else {
        // Unclaimed
        if (isC) {
          // C-shape: bright white/blue pulsing shimmer — inviting
          const pulse = 0.55 + Math.sin(t * 2.5 + px * 0.2 + py * 0.15) * 0.25;
          const r = Math.floor(140 + pulse * 60);
          const g = Math.floor(180 + pulse * 40);
          const b = Math.floor(230 + pulse * 25);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
          // Inner glow highlight
          ctx.fillStyle = `rgba(255,255,255,${pulse * 0.4})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, 1);
        } else {
          // Circle fill: subtle dark blue
          const subtle = 0.15 + Math.sin(t * 1.5 + px * 0.1) * 0.04;
          ctx.fillStyle = `rgba(10, 30, 80, ${0.6 + subtle})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
        }

        // Subtle grid line
        ctx.strokeStyle = 'rgba(0, 50, 120, 0.08)';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(rx + 1, ry + 1, CELL - 2, CELL - 2);

        if (hov) {
          ctx.fillStyle = isC ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 150, 255, 0.4)';
          ctx.fillRect(rx - 1, ry - 1, CELL + 2, CELL + 2);
          ctx.shadowColor = isC ? 'rgba(255,255,255,0.6)' : 'rgba(0,150,255,0.5)';
          ctx.shadowBlur = isC ? 12 : 8;
          ctx.fillRect(rx - 1, ry - 1, CELL + 2, CELL + 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 130, 255, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(GRID / 2, GRID / 2, R_OUTER * CELL, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);
    afRef.current = requestAnimationFrame(draw);

    // Update minimap periodically
    if (Math.floor(t * 4) !== Math.floor((t - 0.03) * 4)) drawMinimap();
  }, [pixels, loadImg, drawMinimap, allPixels, cShapeSet]);

  const screenToGrid = useCallback((cx: number, cy: number) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    const gx = Math.floor((cx - r.left - r.width / 2) / tRef.current.scale + GRID / 2 - tRef.current.x / tRef.current.scale);
    const gy = Math.floor((cy - r.top - r.height / 2) / tRef.current.scale + GRID / 2 - tRef.current.y / tRef.current.scale);
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) return { x: gx, y: gy };
    return null;
  }, []);

  const setZoom = useCallback((s: number) => {
    tRef.current.targetScale = Math.min(8, Math.max(1, s)); // 50%-400%
  }, []);

  const addRipple = (x: number, y: number) => {
    const id = ripId.current++;
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const w = (e: WheelEvent) => { e.preventDefault(); setZoom(tRef.current.targetScale * (e.deltaY > 0 ? 0.9 : 1.1)); };
    const d = (e: MouseEvent) => {
      velRef.current = { x: 0, y: 0 };
      dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, px: tRef.current.x, py: tRef.current.y };
      lastRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const m = (e: MouseEvent) => {
      const pos = screenToGrid(e.clientX, e.clientY);
      const prev = hoverRef.current;
      hoverRef.current = (pos && isLogoPixel(pos.x, pos.y)) ? { x: pos.x, y: pos.y } : null;

      if (pos && isLogoPixel(pos.x, pos.y)) {
        const pix = pixels.get(`${pos.x},${pos.y}`);
        if (pix) {
          if (!prev || prev.x !== pos.x || prev.y !== pos.y) {
            setTooltip({ pixel: pix, x: pos.x, y: pos.y, screenX: e.clientX, screenY: e.clientY });
          }
        } else {
          setTooltip(null);
        }
      } else { setTooltip(null); }

      if (!dragRef.current.active) return;
      const n = performance.now();
      if (n - lastRef.current.t > 10) {
        velRef.current = { x: e.clientX - lastRef.current.x, y: e.clientY - lastRef.current.y };
        lastRef.current = { x: e.clientX, y: e.clientY, t: n };
      }
      tRef.current.x = dragRef.current.px + (e.clientX - dragRef.current.sx);
      tRef.current.y = dragRef.current.py + (e.clientY - dragRef.current.sy);
    };
    const u = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = Math.abs(e.clientX - dragRef.current.sx), dy = Math.abs(e.clientY - dragRef.current.sy);
      dragRef.current.active = false;
      if (dx < 3 && dy < 3) {
        velRef.current = { x: 0, y: 0 };
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          addRipple(pos.x * CELL + CELL / 2, pos.y * CELL + CELL / 2);
          onPixelClick(pos.x, pos.y, !!pixels.get(`${pos.x},${pos.y}`));
        }
      }
    };
    let td = 0;
    const ts = (e: TouchEvent) => { if (e.touches.length === 2) { const dx = e.touches[1].clientX - e.touches[0].clientX, dy = e.touches[1].clientY - e.touches[0].clientY; td = Math.sqrt(dx * dx + dy * dy); } };
    const tm = (e: TouchEvent) => { if (e.touches.length === 2) { e.preventDefault(); const dx = e.touches[1].clientX - e.touches[0].clientX, dy = e.touches[1].clientY - e.touches[0].clientY; const nd = Math.sqrt(dx * dx + dy * dy); if (td > 0) setZoom(tRef.current.targetScale * (nd / td)); td = nd; } };

    c.addEventListener('wheel', w, { passive: false });
    c.addEventListener('mousedown', d); c.addEventListener('mousemove', m); c.addEventListener('mouseup', u);
    c.addEventListener('mouseleave', () => { dragRef.current.active = false; hoverRef.current = null; setTooltip(null); });
    c.addEventListener('touchstart', ts, { passive: true }); c.addEventListener('touchmove', tm, { passive: false });
    afRef.current = requestAnimationFrame(draw);
    return () => {
      c.removeEventListener('wheel', w); c.removeEventListener('mousedown', d);
      c.removeEventListener('mousemove', m); c.removeEventListener('mouseup', u);
      c.removeEventListener('touchstart', ts); c.removeEventListener('touchmove', tm);
      cancelAnimationFrame(afRef.current);
    };
  }, [draw, screenToGrid, pixels, onPixelClick, setZoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-[18px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

      {/* Ripple effects */}
      {ripples.map(r => (
        <div key={r.id} className="absolute pointer-events-none animate-ripple rounded-full border border-white/30"
          style={{
            left: r.x - 5, top: r.y - 5, width: 10, height: 10,
            transform: `translate(-50%, -50%)`,
          }} />
      ))}

      {/* Hover tooltip */}
      {tooltip && (
        <div className="absolute z-20 glass px-3 py-2.5 pointer-events-none animate-scale-in"
          style={{ left: Math.min(tooltip.screenX + 14, (containerRef.current?.clientWidth || 400) - 160), top: tooltip.screenY - 80 }}>
          <div className="flex items-center gap-2 mb-1">
            <img src={tooltip.pixel.profile_pic_url || ''} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0052FF]/30"
              onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
            <div>
              <div className="text-white text-xs font-bold font-display">@{tooltip.pixel.username}</div>
              <div className="text-white/30 text-[10px]">
                {tooltip.pixel.claimed_at
                  ? `Claimed ${Math.max(1, Math.floor((Date.now() - new Date(tooltip.pixel.claimed_at).getTime()) / 86400000))}d ago`
                  : ''}
              </div>
            </div>
          </div>
          {tooltip.pixel.message && <div className="text-white/50 text-[11px] italic">&ldquo;{tooltip.pixel.message}&rdquo;</div>}
        </div>
      )}

      {/* Minimap */}
      <div className="absolute top-2 right-2 z-10 rounded-lg overflow-hidden border border-white/[0.06] opacity-70 hover:opacity-100 transition-opacity">
        <canvas ref={miniRef} className="w-[60px] h-[60px]" />
      </div>

      {/* Zoom controls — bottom center pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0.5 glass rounded-full px-1.5 py-1 border border-white/[0.05]">
          <button onClick={() => setZoom(tRef.current.targetScale - 0.3)} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white text-sm rounded-full hover:bg-white/[0.04] transition-colors">−</button>
          <span className="text-white/40 text-[11px] min-w-[42px] text-center font-medium tabular-nums">{zoomPct}%</span>
          <button onClick={() => setZoom(tRef.current.targetScale + 0.3)} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white text-sm rounded-full hover:bg-white/[0.04] transition-colors">+</button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <button onClick={() => { tRef.current.targetScale = 1; tRef.current.x = 0; tRef.current.y = 0; }} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white text-[11px] rounded-full hover:bg-white/[0.04] transition-colors font-medium">⊡</button>
        </div>
      </div>

      {/* LIVE badge */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 glass rounded-full px-2.5 py-1 border border-white/[0.04]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFA3]" />
        </span>
        <span className="text-[#00FFA3] text-[10px] font-medium">LIVE</span>
      </div>

      {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#04070F]/90 z-20"><div className="text-white/30 text-xs">Loading...</div></div>}
    </div>
  );
}
