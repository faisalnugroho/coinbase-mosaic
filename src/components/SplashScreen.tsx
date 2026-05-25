'use client';
// Premium splash screen — pixels forming the Coinbase C, 1.8s cinematic intro

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'form' | 'fade'>('form');
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = document.getElementById('splash-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // C logo mask (simplified for splash — just the ring shape)
    const cx = w / 2, cy = h / 2;
    const outerR = Math.min(w, h) * 0.18;
    const innerR = outerR * 0.65;
    const totalPixels = 200;
    const pixelSize = 4;

    // Generate pixel positions for the C shape
    const pixels: { x: number; y: number; targetX: number; targetY: number; alpha: number }[] = [];

    for (let i = 0; i < totalPixels; i++) {
      const angle = (i / totalPixels) * Math.PI * 2 * 0.85 - Math.PI * 0.45;
      const dist = innerR + (outerR - innerR) * (0.3 + Math.random() * 0.7);
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;

      // Start from random scattered positions
      const startAngle = Math.random() * Math.PI * 2;
      const startDist = Math.max(w, h) * (0.6 + Math.random() * 0.4);
      const sx = cx + Math.cos(startAngle) * startDist;
      const sy = cy + Math.sin(startAngle) * startDist;

      pixels.push({ x: sx, y: sy, targetX: tx, targetY: ty, alpha: 0.6 + Math.random() * 0.4 });
    }

    const startTime = performance.now();
    const formDuration = 1500; // 1.5s to form
    const fadeDuration = 400;   // 0.4s to fade out
    const totalDuration = formDuration + fadeDuration;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / formDuration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      ctx!.clearRect(0, 0, w, h);

      // Draw background
      ctx!.fillStyle = '#080b1a';
      ctx!.fillRect(0, 0, w, h);

      // Ambient glow that grows
      const glowAlpha = eased * 0.25;
      const glowGrad = ctx!.createRadialGradient(cx, cy, innerR * 0.5, cx, cy, outerR * 1.5);
      glowGrad.addColorStop(0, `rgba(0, 82, 255, ${glowAlpha})`);
      glowGrad.addColorStop(0.5, `rgba(0, 82, 255, ${glowAlpha * 0.4})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = glowGrad;
      ctx!.fillRect(0, 0, w, h);

      // Draw each pixel animating from scatter to C shape
      for (const p of pixels) {
        const px = p.x + (p.targetX - p.x) * eased;
        const py = p.y + (p.targetY - p.y) * eased;
        const alpha = p.alpha * (0.4 + eased * 0.6);

        // Pulse effect
        const pulse = 1 + Math.sin(now * 0.005 + px * 0.01) * 0.15;

        ctx!.fillStyle = `rgba(0, 82, 255, ${alpha})`;
        ctx!.fillRect(
          px - (pixelSize * pulse) / 2,
          py - (pixelSize * pulse) / 2,
          pixelSize * pulse,
          pixelSize * pulse
        );

        // Glow halo on each pixel
        ctx!.fillStyle = `rgba(0, 130, 255, ${alpha * 0.3})`;
        ctx!.fillRect(
          px - pixelSize,
          py - pixelSize,
          pixelSize * 2,
          pixelSize * 2
        );
      }

      if (elapsed < totalDuration) {
        if (elapsed > formDuration && phase === 'form') {
          setPhase('fade');
        }
        requestAnimationFrame(animate);
      } else {
        setCanvasReady(true);
        setTimeout(onComplete, 100);
      }
    }

    setCanvasReady(true);
    requestAnimationFrame(animate);
  }, [onComplete, phase]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#080b1a] flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: phase === 'fade' ? 0 : 1 }}
    >
      <canvas id="splash-canvas" className="absolute inset-0" />
      {/* "coinbase MOSAIC" text fades in */}
      <div
        className="absolute bottom-[15%] text-center transition-all duration-700"
        style={{
          opacity: phase === 'fade' ? 0 : Math.min(1, (canvasReady ? 1 : 0)),
          transform: `translateY(${phase === 'fade' ? '20px' : '0px'})`,
        }}
      >
        <div className="text-white/20 text-[10px] tracking-[0.3em] uppercase">coinbase</div>
        <div className="text-white/40 text-[11px] tracking-[0.2em] uppercase mt-1">mosaic</div>
      </div>
    </div>
  );
}
