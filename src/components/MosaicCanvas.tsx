'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { supabase, Pixel } from '@/lib/supabase';
import { isLogoPixel, LOGO_PIXELS } from '@/lib/logo-mask';

interface MosaicCanvasProps {
  pixels: Map<string, Pixel>;
  onPixelClick: (x: number, y: number, claimed: boolean) => void;
  onPixelHover: (x: number, y: number, pixel: Pixel | null, clientX: number, clientY: number) => void;
}

export default function MosaicCanvas({ pixels, onPixelClick, onPixelHover }: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Zoom/pan state
  const transformRef = useRef({ x: 0, y: 0, scale: 5 }); // Start zoomed in
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const CELL_SIZE = 8; // Base cell size in pixels
  const GRID_PX = CELL_SIZE * 100; // 800px

  // Load images
  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(url);
    if (cached) return Promise.resolve(cached);
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.current.set(url, img);
        resolve(img);
      };
      img.onerror = () => resolve(img);
      img.src = url;
    });
  }, []);

  // Draw the grid
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: panX, y: panY, scale } = transformRef.current;
    
    // Set canvas size to match container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply transform: pan, then scale from center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-GRID_PX / 2 + panX / scale, -GRID_PX / 2 + panY / scale);

    // Draw background (dark)
    ctx.fillStyle = '#0a0b1e';
    ctx.fillRect(0, 0, GRID_PX, GRID_PX);

    // Draw non-logo area as slightly different dark
    ctx.fillStyle = '#0d0e24';
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        if (!isLogoPixel(x, y)) {
          ctx.fillRect(x * CELL_SIZE + 0.5, y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Draw logo pixels
    const pendingLoads: Promise<void>[] = [];
    
    for (const [px, py] of LOGO_PIXELS) {
      const key = `${px},${py}`;
      const pixel = pixels.get(key);
      const rx = px * CELL_SIZE;
      const ry = py * CELL_SIZE;

      if (pixel && pixel.profile_pic_url) {
        // Draw claimed pixel with profile photo
        const img = imageCache.current.get(pixel.profile_pic_url);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, rx, ry, CELL_SIZE, CELL_SIZE);
        } else {
          // Placeholder while loading
          ctx.fillStyle = '#0052FF';
          ctx.fillRect(rx, ry, CELL_SIZE, CELL_SIZE);
          if (pixel.profile_pic_url) {
            pendingLoads.push(
              loadImage(pixel.profile_pic_url).then(() => draw())
            );
          }
        }
      } else {
        // Draw empty pixel (Coinbase blue tint)
        ctx.fillStyle = '#0052FF';
        ctx.fillRect(rx + 0.5, ry + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }

    // Grid lines (subtle, only when zoomed in enough)
    if (scale > 3) {
      ctx.strokeStyle = 'rgba(10, 11, 30, 0.3)';
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= 100; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, GRID_PX);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(GRID_PX, i * CELL_SIZE);
        ctx.stroke();
      }
    }

    ctx.restore();
    setLoading(false);
  }, [pixels, loadImage]);

  // Convert click coordinates to grid position
  const screenToGrid = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, scale } = transformRef.current;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Invert the transform
    const screenX = clientX - rect.left - centerX;
    const screenY = clientY - rect.top - centerY;
    
    const worldX = screenX / scale + GRID_PX / 2 - panX / scale;
    const worldY = screenY / scale + GRID_PX / 2 - panY / scale;
    
    const gx = Math.floor(worldX / CELL_SIZE);
    const gy = Math.floor(worldY / CELL_SIZE);
    
    if (gx >= 0 && gx < 100 && gy >= 0 && gy < 100) {
      return { x: gx, y: gy };
    }
    return null;
  }, []);

  // Mouse handlers for zoom/pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      transformRef.current.scale = Math.min(20, Math.max(1, transformRef.current.scale * delta));
      draw();
    };

    const handleMouseDown = (e: MouseEvent) => {
      dragRef.current.active = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.panX = transformRef.current.x;
      dragRef.current.panY = transformRef.current.y;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) {
        // Hover tracking
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          const key = `${pos.x},${pos.y}`;
          const pixel = pixels.get(key);
          onPixelHover(pos.x, pos.y, pixel || null, e.clientX, e.clientY);
        }
        return;
      }

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      transformRef.current.x = dragRef.current.panX + dx;
      transformRef.current.y = dragRef.current.panY + dy;
      draw();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);
      
      dragRef.current.active = false;
      
      // If barely moved, treat as click
      if (dx < 3 && dy < 3) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos && isLogoPixel(pos.x, pos.y)) {
          const key = `${pos.x},${pos.y}`;
          const pixel = pixels.get(key);
          onPixelClick(pos.x, pos.y, !!pixel);
        }
      }
    };

    // Touch handlers
    let lastTouchDist = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        dragRef.current.active = true;
        dragRef.current.startX = e.touches[0].clientX;
        dragRef.current.startY = e.touches[0].clientY;
        dragRef.current.panX = transformRef.current.x;
        dragRef.current.panY = transformRef.current.y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastTouchDist > 0) {
          transformRef.current.scale = Math.min(20, Math.max(1, 
            transformRef.current.scale * (dist / lastTouchDist)
          ));
          draw();
        }
        lastTouchDist = dist;
      } else if (e.touches.length === 1 && dragRef.current.active) {
        const dx = e.touches[0].clientX - dragRef.current.startX;
        const dy = e.touches[0].clientY - dragRef.current.startY;
        transformRef.current.x = dragRef.current.panX + dx;
        transformRef.current.y = dragRef.current.panY + dy;
        draw();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        dragRef.current.active = false;
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', () => { dragRef.current.active = false; });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draw, screenToGrid, pixels, onPixelClick, onPixelHover]);

  // Redraw when pixels change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0b1e]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b1e]/80">
          <div className="text-white/60 text-sm animate-pulse">Loading mosaic...</div>
        </div>
      )}
    </div>
  );
}
