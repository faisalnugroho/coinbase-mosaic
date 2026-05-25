'use client';
// Cinematic mosaic canvas — particle field, smooth zoom, ripple, monumental feel

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS, C_SHAPE_PIXELS, CIRCLE_FILL_PIXELS, SCATTER_PIXELS } from '@/lib/logo-mask';

interface Props {
  pixels: Map<string, Pixel>;
  onPixelClick: (x: number, y: number, claimed: boolean) => void;
  recentClaims?: { username: string; x: number; y: number }[];
}

const CELL = 8, GRID = CELL * 100;
const CX = 49.5, CY = 49.5, R = 42;

export default function MosaicCanvas({ pixels, onPixelClick, recentClaims = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomPct, setZoomPct] = useState(50);
  const [tooltip, setTooltip] = useState<{ pixel: Pixel; sx: number; sy: number } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; gx: number; gy: number }[]>([]);
  const ripId = useRef(0);

  // ── Refs (no re-render on change) ──
  const tRef = useRef({ x: 0, y: 0, scale: 1, target: 1 });
  const dragRef = useRef({ a: false, sx: 0, sy: 0, px: 0, py: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0, t: 0 });
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hovRef = useRef<{ x: number; y: number } | null>(null);
  const afRef = useRef(0);
  const animTime = useRef(0);
  const lastFrameTime = useRef(0);
  const starsRef = useRef<{ x: number; y: number; vx: number; vy: number; a: number; s: number; life: number; maxLife: number }[]>([]);
  const claimGlows = useRef<{ gx: number; gy: number; start: number }[]>([]);
  // Store pixels in a ref so draw() never recreates when pixels prop changes
  const pixelsRef = useRef(pixels);
  pixelsRef.current = pixels;
  const onPixelClickRef = useRef(onPixelClick);
  onPixelClickRef.current = onPixelClick;
  // Throttle zoom display to avoid per-frame React renders
  const lastDisplayedZoom = useRef(50);

  const cSet = useMemo(() => new Set(C_SHAPE_PIXELS.map(([x,y]) => `${x},${y}`)), []);
  const allPixels = useMemo(() => LOGO_PIXELS, []);

  // Init star field
  useEffect(() => {
    for (let i = 0; i < 120; i++) {
      const life = 3 + Math.random() * 8;
      starsRef.current.push({
        x: Math.random() * GRID, y: Math.random() * GRID,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        a: 0.05 + Math.random() * 0.3, s: 0.5 + Math.random() * 1.8,
        life: Math.random() * life, maxLife: life,
      });
    }
  }, []);

  // Recent claim glows
  useEffect(() => {
    if (recentClaims.length > 0) {
      const latest = recentClaims[recentClaims.length - 1];
      claimGlows.current.push({ gx: latest.x, gy: latest.y, start: performance.now() });
      if (claimGlows.current.length > 10) claimGlows.current.shift();
    }
  }, [recentClaims]);

  const loadImg = useCallback((url: string): Promise<HTMLImageElement> => {
    if (imgCache.current.has(url)) return Promise.resolve(imgCache.current.get(url)!);
    return new Promise(r => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => { imgCache.current.set(url, i); r(i); }; i.onerror = () => r(i); i.src = url; });
  }, []);

  // ── Draw loop — reads from refs only, never recreates ──
  const draw = useCallback((ts: number) => {
    const c = canvasRef.current; if (!c) { afRef.current = requestAnimationFrame(draw); return; }
    const ctx = c.getContext('2d'); if (!ctx) { afRef.current = requestAnimationFrame(draw); return; }

    // Time delta for smooth physics
    const dt = lastFrameTime.current ? Math.min((ts - lastFrameTime.current) / 1000, 0.1) : 0.016;
    lastFrameTime.current = ts;
    animTime.current = ts;
    const t = ts * 0.001;

    // ── Smooth inertia (time-based decay) ──
    if (!dragRef.current.a) {
      const decay = Math.pow(0.02, dt); // smooth exponential decay
      velRef.current.x *= decay;
      velRef.current.y *= decay;
      if (Math.abs(velRef.current.x) > 0.3 || Math.abs(velRef.current.y) > 0.3) {
        tRef.current.x += velRef.current.x * dt * 60;
        tRef.current.y += velRef.current.y * dt * 60;
      } else {
        velRef.current = { x: 0, y: 0 };
      }
    }

    // ── Snappy zoom interpolation ──
    const diff = tRef.current.target - tRef.current.scale;
    if (Math.abs(diff) < 0.001) {
      tRef.current.scale = tRef.current.target;
    } else {
      // lerp with time-based factor for frame-rate independence
      tRef.current.scale += diff * (1 - Math.pow(0.05, dt * 60));
    }

    // Throttled zoom display — only update React state when display changes
    const displayZoom = Math.round(tRef.current.scale * 50);
    if (displayZoom !== lastDisplayedZoom.current) {
      lastDisplayedZoom.current = displayZoom;
      setZoomPct(displayZoom);
    }

    const { x: px, y: py, scale } = tRef.current;
    const cont = containerRef.current; if (!cont) { afRef.current = requestAnimationFrame(draw); return; }
    const dpr = window.devicePixelRatio || 1;
    const cw = cont.clientWidth, ch = cont.clientHeight;

    // Only resize canvas if dimensions changed
    if (c.width !== cw * dpr || c.height !== ch * dpr) {
      c.width = cw * dpr;
      c.height = ch * dpr;
      c.style.width = `${cw}px`;
      c.style.height = `${ch}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();

    // View transform
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(scale, scale);
    ctx.translate(-GRID / 2 + px / scale, -GRID / 2 + py / scale);

    // Void background — only draw visible area for perf
    ctx.fillStyle = '#030611';
    ctx.fillRect(
      Math.max(0, -px / scale - 10),
      Math.max(0, -py / scale - 10),
      Math.min(GRID, cw / scale + 20),
      Math.min(GRID, ch / scale + 20),
    );

    // Stars
    for (const s of starsRef.current) {
      s.life += dt;
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      if (s.life > s.maxLife) { s.x = Math.random() * GRID; s.y = Math.random() * GRID; s.life = 0; s.maxLife = 3 + Math.random() * 8; }
      const fade = s.life < 0.5 ? s.life / 0.5 : s.life > s.maxLife - 0.5 ? (s.maxLife - s.life) / 0.5 : 1;
      ctx.fillStyle = `rgba(180,200,255,${s.a * fade})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Orb glow
    const br = 0.08 + Math.sin(t * 0.4) * 0.05;
    const g = ctx.createRadialGradient(GRID / 2, GRID / 2, 100, GRID / 2, GRID / 2, 480);
    g.addColorStop(0, `rgba(0,82,255,${br + 0.15})`);
    g.addColorStop(0.5, `rgba(0,60,200,${br * 0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GRID, GRID);

    // Scatter
    for (const [sx, sy] of SCATTER_PIXELS) {
      const hx = ((sx * 374761393 + sy * 668265263) & 0x7fffffff) / 0x7fffffff;
      const ox = (hx - 0.5) * 4.5;
      const d = Math.sqrt((sx - CX) ** 2 + (sy - CY) ** 2);
      const fi = Math.max(0, 1 - (d - R) / 10);
      const a = (0.05 + hx * 0.15 + Math.sin(t + sx * 0.1) * 0.03) * fi;
      ctx.fillStyle = `rgba(0,82,255,${a})`;
      ctx.fillRect(sx * CELL + ox, sy * CELL, CELL - 1, CELL - 1);
    }

    // Claim glows
    const now = performance.now();
    claimGlows.current = claimGlows.current.filter(cg => now - cg.start < 2000);
    for (const cg of claimGlows.current) {
      const age = (now - cg.start) / 2000;
      const alpha = (1 - age) * 0.6;
      const radius = 3 + age * 15;
      const glow = ctx.createRadialGradient(
        cg.gx * CELL + CELL / 2, cg.gy * CELL + CELL / 2, 0,
        cg.gx * CELL + CELL / 2, cg.gy * CELL + CELL / 2, radius * CELL,
      );
      glow.addColorStop(0, `rgba(0,180,255,${alpha})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cg.gx * CELL - radius * CELL, cg.gy * CELL - radius * CELL, radius * CELL * 2, radius * CELL * 2);
    }

    // Logo pixels — read from ref, never recreates draw
    const pxPixels = pixelsRef.current;
    for (const [px, py] of allPixels) {
      const key = `${px},${py}`;
      const pixel = pxPixels.get(key);
      const rx = px * CELL, ry = py * CELL;
      const hov = hovRef.current?.x === px && hovRef.current?.y === py;
      const isC = cSet.has(key);

      if (pixel?.profile_pic_url) {
        const img = imgCache.current.get(pixel.profile_pic_url);
        if (img?.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(rx + 1, ry + 1, CELL - 2, CELL - 2, 1.5);
          ctx.clip();
          ctx.drawImage(img, rx, ry, CELL, CELL);
          if (hov) {
            ctx.strokeStyle = 'rgba(0,200,255,0.85)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0,200,255,0.5)';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        } else {
          ctx.fillStyle = isC ? '#1a3060' : '#0c1830';
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
          if (pixel.profile_pic_url) loadImg(pixel.profile_pic_url).then(() => { /* will redraw naturally */ });
        }
      } else {
        if (isC) {
          const pulse = 0.5 + Math.sin(t * 2.2 + px * 0.2 + py * 0.15) * 0.3;
          ctx.fillStyle = `rgb(${Math.floor(130 + pulse * 70)},${Math.floor(170 + pulse * 50)},${Math.floor(220 + pulse * 35)})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
          ctx.fillStyle = `rgba(255,255,255,${pulse * 0.35})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, 1);
        } else {
          const sub = 0.12 + Math.sin(t * 1.2 + px * 0.08) * 0.03;
          ctx.fillStyle = `rgba(8,24,60,${0.55 + sub})`;
          ctx.fillRect(rx + 1, ry + 1, CELL - 2, CELL - 2);
        }
        if (hov) {
          ctx.fillStyle = isC ? 'rgba(255,255,255,0.65)' : 'rgba(0,150,255,0.35)';
          ctx.fillRect(rx - 1, ry - 1, CELL + 2, CELL + 2);
          ctx.shadowColor = isC ? 'rgba(255,255,255,0.5)' : 'rgba(0,150,255,0.4)';
          ctx.shadowBlur = isC ? 14 : 8;
          ctx.fillRect(rx - 1, ry - 1, CELL + 2, CELL + 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Outer ring
    ctx.strokeStyle = 'rgba(0,130,255,0.25)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(GRID / 2, GRID / 2, R * CELL, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    setLoading(false);
    afRef.current = requestAnimationFrame(draw);
  }, [loadImg, cSet, allPixels]); // NOTE: pixels NOT in deps — read from ref

  const screenToGrid = useCallback((cx: number, cy: number) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    const gx = Math.floor(((cx - r.left - r.width / 2) / tRef.current.scale + GRID / 2 - tRef.current.x / tRef.current.scale) / CELL);
    const gy = Math.floor(((cy - r.top - r.height / 2) / tRef.current.scale + GRID / 2 - tRef.current.y / tRef.current.scale) / CELL);
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) return { x: gx, y: gy };
    return null;
  }, []);

  const setZoom = useCallback((s: number) => { tRef.current.target = Math.min(8, Math.max(0.6, s)); }, []);

  const addRipple = (gx: number, gy: number) => {
    const id = ripId.current++;
    setRipples(p => [...p, { id, gx, gy }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 700);
  };

  const getRippleScreenPos = (gx: number, gy: number) => {
    const cont = containerRef.current; if (!cont) return { x: 0, y: 0 };
    const cw = cont.clientWidth, ch = cont.clientHeight;
    const wx = gx * CELL + CELL / 2, wy = gy * CELL + CELL / 2;
    const sx = (wx - GRID / 2 + tRef.current.x / tRef.current.scale) * tRef.current.scale + cw / 2;
    const sy = (wy - GRID / 2 + tRef.current.y / tRef.current.scale) * tRef.current.scale + ch / 2;
    return { x: sx, y: sy };
  };

  // ── Event handlers (one-time setup, stable) ──
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;

    // Wheel zoom — smooth with accumulated delta
    let wheelAccum = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum += e.deltaY;
      // Apply zoom when accumulated delta crosses threshold
      if (Math.abs(wheelAccum) > 30) {
        const factor = wheelAccum > 0 ? 0.85 : 1.18;
        setZoom(tRef.current.target * factor);
        wheelAccum = 0;
      }
      // Also handle single large deltas immediately (trackpad pinch)
      if (Math.abs(e.deltaY) > 50) {
        setZoom(tRef.current.target * (e.deltaY > 0 ? 0.92 : 1.09));
        wheelAccum = 0;
      }
    };

    // ── Mouse: window-level for smooth off-canvas drag ──
    let mouseDownTime = 0;
    let mouseMaxDist = 0;
    const handleMouseDown = (e: MouseEvent) => {
      velRef.current = { x: 0, y: 0 };
      dragRef.current = { a: true, sx: e.clientX, sy: e.clientY, px: tRef.current.x, py: tRef.current.y };
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      mouseDownTime = performance.now();
      mouseMaxDist = 0;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseMove = (e: MouseEvent) => {
      const pos = screenToGrid(e.clientX, e.clientY);
      hovRef.current = (pos && isLogoPixel(pos.x, pos.y)) ? { x: pos.x, y: pos.y } : null;
      if (pos && isLogoPixel(pos.x, pos.y)) {
        const pix = pixelsRef.current.get(`${pos.x},${pos.y}`);
        if (pix) setTooltip({ pixel: pix, sx: e.clientX, sy: e.clientY });
        else setTooltip(null);
      } else { setTooltip(null); hovRef.current = null; }
      if (!dragRef.current.a) return;
      const now = performance.now();
      const dt = now - lastMouseRef.current.t;
      // Velocity: px/frame (60fps-equivalent) for natural-feeling inertia
      if (dt > 4) {
        velRef.current = {
          x: (e.clientX - lastMouseRef.current.x) / (dt / 16.67),
          y: (e.clientY - lastMouseRef.current.y) / (dt / 16.67),
        };
        lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
      }
      const dist = Math.sqrt((e.clientX - dragRef.current.sx) ** 2 + (e.clientY - dragRef.current.sy) ** 2);
      if (dist > mouseMaxDist) mouseMaxDist = dist;
      tRef.current.x = dragRef.current.px + (e.clientX - dragRef.current.sx);
      tRef.current.y = dragRef.current.py + (e.clientY - dragRef.current.sy);
    };
    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (!dragRef.current.a) return;
      dragRef.current.a = false;
      const duration = performance.now() - mouseDownTime;
      if (duration < 300 && mouseMaxDist < 16) {
        velRef.current = { x: 0, y: 0 };
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          addRipple(pos.x, pos.y);
          onPixelClickRef.current(pos.x, pos.y, !!pixelsRef.current.get(`${pos.x},${pos.y}`));
        }
      }
    };

    // ── Touch: single-finger pan + two-finger pinch ──
    let touchId: number | null = null;
    let touchStartX = 0, touchStartY = 0;
    let touchStartPanX = 0, touchStartPanY = 0;
    let lastTouchX = 0, lastTouchY = 0;
    let touchStartTime = 0;
    let touchMaxDist = 0;
    let pinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchId = t.identifier;
        touchStartX = lastTouchX = t.clientX;
        touchStartY = lastTouchY = t.clientY;
        touchStartPanX = tRef.current.x;
        touchStartPanY = tRef.current.y;
        touchStartTime = performance.now();
        touchMaxDist = 0;
        dragRef.current.a = true;
        velRef.current = { x: 0, y: 0 };
      } else if (e.touches.length === 2) {
        touchId = null;
        dragRef.current.a = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        pinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchId !== null && dragRef.current.a) {
        e.preventDefault();
        const t = e.touches[0];
        if (t.identifier === touchId) {
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          const dist = Math.sqrt((t.clientX - touchStartX) ** 2 + (t.clientY - touchStartY) ** 2);
          if (dist > touchMaxDist) touchMaxDist = dist;
          tRef.current.x = touchStartPanX + (t.clientX - touchStartX);
          tRef.current.y = touchStartPanY + (t.clientY - touchStartY);
        }
      } else if (e.touches.length === 2) {
        e.preventDefault();
        touchId = null;
        dragRef.current.a = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const nd = Math.sqrt(dx * dx + dy * dy);
        if (pinchDist > 0) setZoom(tRef.current.target * (nd / pinchDist));
        pinchDist = nd;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (dragRef.current.a && touchId !== null) {
          dragRef.current.a = false;
          const duration = performance.now() - touchStartTime;
          if (duration < 350 && touchMaxDist < 24) {
            const pos = screenToGrid(lastTouchX, lastTouchY);
            if (pos && isLogoPixel(pos.x, pos.y)) {
              addRipple(pos.x, pos.y);
              onPixelClickRef.current(pos.x, pos.y, !!pixelsRef.current.get(`${pos.x},${pos.y}`));
            }
          }
        }
        touchId = null;
        touchStartTime = 0;
        touchMaxDist = 0;
        pinchDist = 0;
      } else if (e.touches.length === 1) {
        // 2→1 finger transition
        const t = e.touches[0];
        touchId = t.identifier;
        touchStartX = lastTouchX = t.clientX;
        touchStartY = lastTouchY = t.clientY;
        touchStartPanX = tRef.current.x;
        touchStartPanY = tRef.current.y;
        touchStartTime = performance.now();
        touchMaxDist = 0;
        dragRef.current.a = true;
        velRef.current = { x: 0, y: 0 };
        pinchDist = 0;
      }
    };

    c.addEventListener('wheel', handleWheel, { passive: false });
    c.addEventListener('mousedown', handleMouseDown);
    c.addEventListener('touchstart', handleTouchStart, { passive: false });
    c.addEventListener('touchmove', handleTouchMove, { passive: false });
    c.addEventListener('touchend', handleTouchEnd);
    c.addEventListener('touchcancel', handleTouchEnd);
    lastFrameTime.current = 0;
    afRef.current = requestAnimationFrame(draw);

    return () => {
      c.removeEventListener('wheel', handleWheel);
      c.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      c.removeEventListener('touchstart', handleTouchStart);
      c.removeEventListener('touchmove', handleTouchMove);
      c.removeEventListener('touchend', handleTouchEnd);
      c.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(afRef.current);
    };
    // draw is stable (depends only on loadImg, cSet, allPixels — all stable after mount)
    // screenToGrid and setZoom are stable ([] deps)
    // pixels and onPixelClick are NOT in deps — read from refs
  }, [draw, screenToGrid, setZoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-2xl">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

      {/* Ripples */}
      {ripples.map(r => {
        const pos = getRippleScreenPos(r.gx, r.gy);
        return <div key={r.id} className="absolute pointer-events-none rounded-full border border-[#00b4d8]/40" style={{ left: pos.x, top: pos.y, width: 8, height: 8, animation: 'ripple 0.7s ease-out forwards' }} />;
      })}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute z-20 glass px-3.5 py-2.5 pointer-events-none fade-scale" style={{ left: Math.min(tooltip.sx + 16, (containerRef.current?.clientWidth || 400) - 170), top: tooltip.sy - 85 }}>
          <div className="flex items-center gap-2.5">
            <img src={tooltip.pixel.profile_pic_url || ''} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0052FF]/25" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
            <div>
              <div className="text-white text-xs font-bold">@{tooltip.pixel.username}</div>
              <div className="text-[#5c6880] text-[10px]">{tooltip.pixel.claimed_at ? `${Math.max(1, Math.floor((Date.now() - new Date(tooltip.pixel.claimed_at).getTime()) / 86400000))}d ago` : ''}</div>
            </div>
          </div>
          {tooltip.pixel.message && <div className="text-white/50 text-[11px] italic mt-1.5">&ldquo;{tooltip.pixel.message}&rdquo;</div>}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-0.5 glass rounded-full px-1.5 py-1 border-white/[0.04]">
          <button onClick={() => setZoom(tRef.current.target - 0.3)} className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white text-sm rounded-full hover:bg-white/[0.03] transition-all">−</button>
          <span className="text-white/35 text-[11px] min-w-[44px] text-center font-medium tabular-nums">{zoomPct}%</span>
          <button onClick={() => setZoom(tRef.current.target + 0.3)} className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white text-sm rounded-full hover:bg-white/[0.03] transition-all">+</button>
          <div className="w-px h-4 bg-white/[0.05]" />
          <button onClick={() => { tRef.current.target = 1; tRef.current.x = 0; tRef.current.y = 0; }} className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white text-[11px] rounded-full hover:bg-white/[0.03] transition-all font-medium">⊡</button>
        </div>
      </div>

      {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#030611]/95 z-20"><div className="text-white/25 text-xs">Loading...</div></div>}
    </div>
  );
}
