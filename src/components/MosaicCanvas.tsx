'use client';
// Mosaic canvas — shimmer pixels, glow hover, white C overlay, tooltip

import { useRef, useEffect, useState, useCallback } from 'react';
import { Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS, SCATTER_PIXELS } from '@/lib/logo-mask';

interface Props {
  pixels: Map<string, Pixel>;
  onPixelClick: (x: number, y: number, claimed: boolean) => void;
  onPixelHover: (x: number, y: number, pixel: Pixel | null, cx: number, cy: number) => void;
}

const CELL = 8, GRID = CELL * 100;
// White C overlay constants
const CX = 49.5, CY = 49.5, R_OUTER = 42, R_INNER = 22;

export default function MosaicCanvas({ pixels, onPixelClick, onPixelHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [tooltip, setTooltip] = useState<{ pixel: Pixel; x: number; y: number; screenX: number; screenY: number } | null>(null);

  const tRef = useRef({ x: 0, y: 0, scale: 4, targetScale: 4 });
  const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0, t: 0 });
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const afRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; a: number; s: number }[]>([]);

  // Init star particles
  useEffect(() => { for (let i = 0; i < 80; i++) particlesRef.current.push({ x: Math.random() * 800, y: Math.random() * 800, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, a: 0.1+Math.random()*0.3, s: 0.5+Math.random()*1.5 }); }, []);

  const loadImg = useCallback((url: string): Promise<HTMLImageElement> => {
    if (imgCache.current.has(url)) return Promise.resolve(imgCache.current.get(url)!);
    return new Promise(r => { const i = new Image(); i.crossOrigin='anonymous'; i.onload=()=>{imgCache.current.set(url,i);r(i)}; i.onerror=()=>r(i); i.src=url; });
  }, []);

  const draw = useCallback((ts?: number) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    if (ts !== undefined) timeRef.current = ts;
    const t = timeRef.current * 0.001;
    if (!dragRef.current.active) { velRef.current.x*=0.92; velRef.current.y*=0.92; if (Math.abs(velRef.current.x)>0.1||Math.abs(velRef.current.y)>0.1) { tRef.current.x+=velRef.current.x; tRef.current.y+=velRef.current.y; } else velRef.current={x:0,y:0}; }

    const diff = tRef.current.targetScale - tRef.current.scale;
    if (Math.abs(diff)<0.005) tRef.current.scale=tRef.current.targetScale; else tRef.current.scale+=diff*0.15;
    setZoomLevel(Math.round((tRef.current.scale/4)*100));

    const { x:px, y:py, scale } = tRef.current;
    const cont = containerRef.current; if (!cont) return;
    const dpr = window.devicePixelRatio||1;
    c.width=cont.clientWidth*dpr; c.height=cont.clientHeight*dpr;
    c.style.width=`${cont.clientWidth}px`; c.style.height=`${cont.clientHeight}px`;
    ctx.scale(dpr,dpr);
    const w=cont.clientWidth, h=cont.clientHeight;

    ctx.clearRect(0,0,w,h); ctx.save();
    ctx.translate(w/2,h/2); ctx.scale(scale,scale);
    ctx.translate(-GRID/2+px/scale, -GRID/2+py/scale);

    // Deep space bg
    ctx.fillStyle='#04070F'; ctx.fillRect(0,0,GRID,GRID);

    // Star particles
    for (const p of particlesRef.current) {
      p.x+=p.vx; p.y+=p.vy;
      if (p.x<0) p.x=800; if (p.x>800) p.x=0;
      if (p.y<0) p.y=800; if (p.y>800) p.y=0;
      ctx.fillStyle=`rgba(255,255,255,${p.a})`;
      ctx.fillRect(p.x,p.y,p.s,p.s);
    }

    // Breathing glow
    const br = 0.12+Math.sin(t*0.6)*0.08;
    const g1 = ctx.createRadialGradient(GRID/2,GRID/2,100,GRID/2,GRID/2,440);
    g1.addColorStop(0,`rgba(0,82,255,${br+0.14})`); g1.addColorStop(0.5,`rgba(0,82,255,${br*0.5})`); g1.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g1; ctx.fillRect(0,0,GRID,GRID);

    const g2 = ctx.createRadialGradient(GRID/2,GRID/2,60,GRID/2,GRID/2,300);
    g2.addColorStop(0,`rgba(124,58,237,${br*0.4})`); g2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g2; ctx.fillRect(0,0,GRID,GRID);

    // Scatter particles
    for (const [px,py] of SCATTER_PIXELS) {
      const hx=((px*374761393+py*668265263)&0x7fffffff)/0x7fffffff;
      const ox=(hx-0.5)*4;
      const dist=Math.sqrt((px-49.5)**2+(py-49.5)**2);
      const fi=Math.max(0,1-(dist-42)/8);
      const a=(0.08+hx*0.16+Math.sin(t*1.2+px*0.08)*0.04)*fi;
      ctx.fillStyle=`rgba(0,82,255,${a})`; ctx.fillRect(px*CELL+ox,py*CELL,CELL-1,CELL-1);
    }

    // Logo pixels — full circle fill
    for (const [px,py] of LOGO_PIXELS) {
      const key=`${px},${py}`; const pixel=pixels.get(key);
      const rx=px*CELL, ry=py*CELL;
      const hov=hoverRef.current?.x===px&&hoverRef.current?.y===py;

      if (pixel?.profile_pic_url) {
        const img=imgCache.current.get(pixel.profile_pic_url);
        if (img?.complete&&img.naturalWidth>0) {
          ctx.save(); const cx=rx+CELL/2,cy=ry+CELL/2,cr=CELL/2-0.5;
          ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.clip();
          ctx.drawImage(img,rx,ry,CELL,CELL);
          if (hov) { ctx.beginPath();ctx.arc(cx,cy,cr+2,0,Math.PI*2); ctx.strokeStyle='rgba(0,180,255,0.8)';ctx.lineWidth=2;ctx.shadowColor='rgba(0,180,255,0.5)';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0; }
          ctx.restore();
        } else {
          ctx.fillStyle='#1a3a6a'; ctx.fillRect(rx+.5,ry+.5,CELL-1,CELL-1);
          if (pixel.profile_pic_url) loadImg(pixel.profile_pic_url).then(()=>draw());
        }
      } else {
        // Unclaimed — shimmer blue
        const shimmer=Math.sin(t*2+px*0.15+py*0.1)*0.08;
        const r=18+shimmer*20, g=55+shimmer*30, b=120+shimmer*30;
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(rx+.5,ry+.5,CELL-1,CELL-1);
        ctx.strokeStyle='rgba(0,100,255,0.18)';ctx.lineWidth=.5;
        ctx.strokeRect(rx+.5,ry+.5,CELL-1,CELL-1);
        if (hov) {
          ctx.fillStyle='rgba(0,150,255,0.45)'; ctx.fillRect(rx-1,ry-1,CELL+2,CELL+2);
          ctx.shadowColor='rgba(0,180,255,0.6)';ctx.shadowBlur=10;ctx.fillRect(rx-1,ry-1,CELL+2,CELL+2);ctx.shadowBlur=0;
        }
      }
    }

    // White C overlay
    ctx.save(); ctx.globalAlpha=0.88+Math.sin(t*0.5)*0.06;
    const thick=(R_OUTER-R_INNER)*CELL, midR=((R_OUTER+R_INNER)/2)*CELL;
    const cxPx=CX*CELL, cyPx=CY*CELL;
    const gapS=-Math.PI/5.5, gapE=Math.PI/5.5;
    ctx.strokeStyle='rgba(220,230,255,0.75)'; ctx.lineWidth=thick; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(cxPx,cyPx,midR,gapE,gapS+Math.PI*2,false); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=thick*0.45;
    ctx.beginPath(); ctx.arc(cxPx,cyPx,midR,gapE,gapS+Math.PI*2,false); ctx.stroke();
    ctx.restore();

    // Outer ring
    ctx.strokeStyle='rgba(0,130,255,0.35)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(GRID/2,GRID/2,42*CELL,0,Math.PI*2); ctx.stroke();

    ctx.restore(); setLoading(false);
    afRef.current=requestAnimationFrame(draw);
  }, [pixels, loadImg]);

  const screenToGrid = useCallback((cx:number,cy:number)=>{
    const c=canvasRef.current; if(!c) return null;
    const r=c.getBoundingClientRect();
    const gx=Math.floor((cx-r.left-r.width/2)/tRef.current.scale+GRID/2-tRef.current.x/tRef.current.scale);
    const gy=Math.floor((cy-r.top-r.height/2)/tRef.current.scale+GRID/2-tRef.current.y/tRef.current.scale);
    if(gx>=0&&gx<100&&gy>=0&&gy<100) return {x:gx,y:gy};
    return null;
  },[]);

  const setZoom = useCallback((s:number)=>{tRef.current.targetScale=Math.min(15,Math.max(1.5,s));},[]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const w=(e:WheelEvent)=>{e.preventDefault();setZoom(tRef.current.targetScale*(e.deltaY>0?.88:1.13))};
    const d=(e:MouseEvent)=>{velRef.current={x:0,y:0};dragRef.current={active:true,sx:e.clientX,sy:e.clientY,px:tRef.current.x,py:tRef.current.y};lastRef.current={x:e.clientX,y:e.clientY,t:performance.now()}};
    const m=(e:MouseEvent)=>{
      const pos=screenToGrid(e.clientX,e.clientY);
      const prev=hoverRef.current;
      hoverRef.current=(pos&&isLogoPixel(pos.x,pos.y))?{x:pos.x,y:pos.y}:null;
      // Hover tooltip
      if (pos&&isLogoPixel(pos.x,pos.y)) {
        const pix=pixels.get(`${pos.x},${pos.y}`);
        onPixelHover(pos.x,pos.y,pix||null,e.clientX,e.clientY);
        if (pix&&(!prev||prev.x!==pos.x||prev.y!==pos.y)) {
          setTooltip({pixel:pix,x:pos.x,y:pos.y,screenX:e.clientX,screenY:e.clientY});
        }
      } else { setTooltip(null); }
      if (!dragRef.current.active) return;
      const n=performance.now(); if(n-lastRef.current.t>10){velRef.current={x:e.clientX-lastRef.current.x,y:e.clientY-lastRef.current.y};lastRef.current={x:e.clientX,y:e.clientY,t:n}}
      tRef.current.x=dragRef.current.px+(e.clientX-dragRef.current.sx); tRef.current.y=dragRef.current.py+(e.clientY-dragRef.current.sy);
    };
    const u=(e:MouseEvent)=>{if(!dragRef.current.active) return; const dx=Math.abs(e.clientX-dragRef.current.sx),dy=Math.abs(e.clientY-dragRef.current.sy); dragRef.current.active=false; if(dx<3&&dy<3){velRef.current={x:0,y:0}; const pos=screenToGrid(e.clientX,e.clientY); if(pos&&isLogoPixel(pos.x,pos.y)) onPixelClick(pos.x,pos.y,!!pixels.get(`${pos.x},${pos.y}`))}};
    let td=0;
    const ts=(e:TouchEvent)=>{if(e.touches.length===2){const dx=e.touches[1].clientX-e.touches[0].clientX,dy=e.touches[1].clientY-e.touches[0].clientY;td=Math.sqrt(dx*dx+dy*dy)}};
    const tm=(e:TouchEvent)=>{if(e.touches.length===2){e.preventDefault();const dx=e.touches[1].clientX-e.touches[0].clientX,dy=e.touches[1].clientY-e.touches[0].clientY;const nd=Math.sqrt(dx*dx+dy*dy);if(td>0) setZoom(tRef.current.targetScale*(nd/td));td=nd}};
    c.addEventListener('wheel',w,{passive:false}); c.addEventListener('mousedown',d); c.addEventListener('mousemove',m); c.addEventListener('mouseup',u);
    c.addEventListener('mouseleave',()=>{dragRef.current.active=false;hoverRef.current=null;setTooltip(null)});
    c.addEventListener('touchstart',ts,{passive:true}); c.addEventListener('touchmove',tm,{passive:false});
    afRef.current=requestAnimationFrame(draw);
    return ()=>{c.removeEventListener('wheel',w);c.removeEventListener('mousedown',d);c.removeEventListener('mousemove',m);c.removeEventListener('mouseup',u);c.removeEventListener('touchstart',ts);c.removeEventListener('touchmove',tm);cancelAnimationFrame(afRef.current)};
  },[draw,screenToGrid,pixels,onPixelClick,onPixelHover,setZoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-[18px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

      {/* Hover tooltip */}
      {tooltip && (
        <div className="absolute z-20 glass px-3 py-2 pointer-events-none animate-scale-in"
          style={{ left: Math.min(tooltip.screenX+12, (containerRef.current?.clientWidth||400)-140), top: tooltip.screenY-70 }}>
          <div className="flex items-center gap-2">
            <img src={tooltip.pixel.profile_pic_url||''} alt="" className="w-6 h-6 rounded-full object-cover"
              onError={e=>(e.target as HTMLImageElement).src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230052FF"/></svg>'} />
            <div>
              <div className="text-white text-xs font-semibold">@{tooltip.pixel.username}</div>
              {tooltip.pixel.message && <div className="text-white/50 text-[10px] truncate max-w-[100px]">{tooltip.pixel.message}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
        {[
          {l:'+',a:()=>setZoom(tRef.current.targetScale+1.2)},
          {l:`${zoomLevel}%`,d:true},
          {l:'−',a:()=>setZoom(tRef.current.targetScale-1.2)},
          {l:'⊡',a:()=>{tRef.current.targetScale=3;tRef.current.x=0;tRef.current.y=0}},
        ].map((b,i)=>b.a?<button key={i} onClick={b.a} className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/70 text-[10px] rounded-md transition-colors">{b.l}</button>:<span key={i} className="text-white/20 text-[9px] text-center py-1">{b.l}</span>)}
      </div>

      {loading&&<div className="absolute inset-0 flex items-center justify-center bg-[#04070F]/90 z-20"><div className="text-white/30 text-xs">Loading mosaic...</div></div>}
    </div>
  );
}
