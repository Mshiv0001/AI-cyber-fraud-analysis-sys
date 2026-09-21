import React, { useEffect, useRef } from 'react';

export default function FluidBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / 2.5);
      canvas.height = Math.ceil(window.innerHeight / 2.5);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.012;
      const w = canvas.width;
      const h = canvas.height;

      const isDark = document.documentElement.dataset.theme === 'dark';

      // Base background: soft atmospheric sky blue for light mode, deep sleek midnight sapphire for dark mode
      if (isDark) {
        const baseGrad = ctx.createLinearGradient(0, 0, w, h);
        baseGrad.addColorStop(0, '#070c1a');
        baseGrad.addColorStop(0.5, '#050914');
        baseGrad.addColorStop(1, '#03050c');
        ctx.fillStyle = baseGrad;
      } else {
        ctx.fillStyle = '#c8e2fe';
      }
      ctx.fillRect(0, 0, w, h);

      // Blob 1: Vibrant Flowing Sapphire (flow 1)
      const x1 = w * (0.32 + 0.26 * Math.sin(time * 0.9));
      const y1 = h * (0.35 + 0.22 * Math.cos(time * 0.75));
      const r1 = Math.min(w, h) * (0.58 + 0.08 * Math.sin(time * 1.1));
      const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      if (isDark) {
        g1.addColorStop(0, 'rgba(30, 95, 230, 0.42)');
        g1.addColorStop(0.5, 'rgba(20, 60, 160, 0.20)');
        g1.addColorStop(1, 'rgba(10, 30, 90, 0)');
      } else {
        g1.addColorStop(0, 'rgba(24, 117, 255, 0.85)');
        g1.addColorStop(0.6, 'rgba(59, 130, 246, 0.45)');
        g1.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(x1, y1, r1, 0, Math.PI * 2);
      ctx.fill();

      // Blob 2: Brilliant Flowing Moonlight Glow (flow 2)
      const x2 = w * (0.68 + 0.24 * Math.cos(time * 0.85 + 1));
      const y2 = h * (0.42 + 0.25 * Math.sin(time * 1.05 + 0.6));
      const r2 = Math.min(w, h) * (0.62 + 0.1 * Math.cos(time * 0.9));
      const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      if (isDark) {
        g2.addColorStop(0, 'rgba(147, 197, 253, 0.28)');
        g2.addColorStop(0.4, 'rgba(96, 165, 250, 0.14)');
        g2.addColorStop(0.75, 'rgba(59, 130, 246, 0.04)');
        g2.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else {
        g2.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        g2.addColorStop(0.45, 'rgba(240, 249, 255, 0.8)');
        g2.addColorStop(0.8, 'rgba(219, 234, 254, 0.4)');
        g2.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x2, y2, r2, 0, Math.PI * 2);
      ctx.fill();

      // Blob 3: Soft Ice Cyan Stream (flow 3)
      const x3 = w * (0.24 + 0.28 * Math.cos(time * 1.1 + 2.2));
      const y3 = h * (0.68 + 0.22 * Math.sin(time * 0.8 + 1.4));
      const r3 = Math.min(w, h) * (0.54 + 0.08 * Math.sin(time * 0.65));
      const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, r3);
      if (isDark) {
        g3.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
        g3.addColorStop(0.5, 'rgba(2, 132, 199, 0.15)');
        g3.addColorStop(1, 'rgba(2, 132, 199, 0)');
      } else {
        g3.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
        g3.addColorStop(0.55, 'rgba(125, 211, 252, 0.4)');
        g3.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = g3;
      ctx.beginPath();
      ctx.arc(x3, y3, r3, 0, Math.PI * 2);
      ctx.fill();

      // Blob 4: Soft Radiant Indigo Nebula (flow 4)
      const x4 = w * (0.48 + 0.3 * Math.sin(time * 0.7 + 3.1));
      const y4 = h * (0.22 + 0.2 * Math.cos(time * 0.9 + 2.1));
      const r4 = Math.min(w, h) * (0.5 + 0.09 * Math.sin(time * 1.0));
      const g4 = ctx.createRadialGradient(x4, y4, 0, x4, y4, r4);
      if (isDark) {
        g4.addColorStop(0, 'rgba(129, 140, 248, 0.28)');
        g4.addColorStop(0.5, 'rgba(79, 70, 229, 0.12)');
        g4.addColorStop(1, 'rgba(79, 70, 229, 0)');
      } else {
        g4.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
        g4.addColorStop(0.5, 'rgba(224, 242, 254, 0.7)');
        g4.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = g4;
      ctx.beginPath();
      ctx.arc(x4, y4, r4, 0, Math.PI * 2);
      ctx.fill();

      // Blob 5: Deep Azure Ocean Accent (flow 5)
      const x5 = w * (0.78 + 0.2 * Math.cos(time * 0.75 + 4.2));
      const y5 = h * (0.72 + 0.2 * Math.sin(time * 0.95 + 3.3));
      const r5 = Math.min(w, h) * (0.52 + 0.08 * Math.cos(time * 1.25));
      const g5 = ctx.createRadialGradient(x5, y5, 0, x5, y5, r5);
      if (isDark) {
        g5.addColorStop(0, 'rgba(29, 78, 216, 0.32)');
        g5.addColorStop(0.6, 'rgba(30, 58, 138, 0.14)');
        g5.addColorStop(1, 'rgba(30, 58, 138, 0)');
      } else {
        g5.addColorStop(0, 'rgba(29, 78, 216, 0.75)');
        g5.addColorStop(0.5, 'rgba(96, 165, 250, 0.4)');
        g5.addColorStop(1, 'rgba(29, 78, 216, 0)');
      }
      ctx.fillStyle = g5;
      ctx.beginPath();
      ctx.arc(x5, y5, r5, 0, Math.PI * 2);
      ctx.fill();

      // Blob 6: Ambient Aurora Flow behind Quote Card (flow 6)
      const x6 = w * (0.82 + 0.12 * Math.sin(time * 0.8 + 1.8));
      const y6 = h * (0.16 + 0.10 * Math.cos(time * 0.95 + 0.5));
      const r6 = Math.min(w, h) * (0.50 + 0.08 * Math.sin(time * 1.05));
      const g6 = ctx.createRadialGradient(x6, y6, 0, x6, y6, r6);
      if (isDark) {
        g6.addColorStop(0, 'rgba(56, 189, 248, 0.26)');
        g6.addColorStop(0.4, 'rgba(37, 99, 235, 0.12)');
        g6.addColorStop(0.8, 'rgba(30, 58, 138, 0.04)');
        g6.addColorStop(1, 'rgba(30, 58, 138, 0)');
      } else {
        g6.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        g6.addColorStop(0.45, 'rgba(186, 230, 253, 0.6)');
        g6.addColorStop(1, 'rgba(186, 230, 253, 0)');
      }
      ctx.fillStyle = g6;
      ctx.beginPath();
      ctx.arc(x6, y6, r6, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fluid-bg-container fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter blur-[45px] scale-110"
        style={{ width: '100%', height: '100%' }}
      />
      {/* 3D Liquid glass ribbons overlay */}
      <div className="fluid-bg-glass-overlay absolute inset-0 pointer-events-none" />
      {/* Ambient specular shimmer */}
      <div className="fluid-bg-shimmer absolute inset-0 pointer-events-none" />
    </div>
  );
}
