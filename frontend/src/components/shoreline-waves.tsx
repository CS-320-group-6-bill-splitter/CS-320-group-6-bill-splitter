"use client";

import { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

interface WaveLayer {
  color: string;
  baseY: number;
  seed: number;
  amp: number;
  speed: number;
  isLast?: boolean;
}

export function ShorelineWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise2D = createNoise2D();
    let animationId: number;
    let w: number, h: number;
    let count: number;
    let time = 0;
    const xinc = 0.04;

    const layers: WaveLayer[] = [
      { color: "hsl(195, 80%, 14%)", baseY: 0.30, seed: 0,   amp: 22, speed: 0.0025 },
      { color: "hsl(195, 72%, 22%)", baseY: 0.34, seed: 60,  amp: 20, speed: 0.003 },
      { color: "hsl(195, 65%, 30%)", baseY: 0.39, seed: 120, amp: 20, speed: 0.0035 },
      { color: "hsl(195, 55%, 40%)", baseY: 0.44, seed: 180, amp: 18, speed: 0.003 },
      { color: "hsl(195, 45%, 52%)", baseY: 0.50, seed: 250, amp: 16, speed: 0.004 },
      { color: "hsl(195, 38%, 64%)", baseY: 0.56, seed: 320, amp: 14, speed: 0.0035, isLast: true },
    ];

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      count = Math.floor(w / 40);
    }

    function wave(layer: WaveLayer) {
      if (!ctx) return;
      const length = w + 100;
      const cx = w / 2;
      const topBaseY = h * layer.baseY;
      const sway = noise2D(time * layer.speed * 100 + layer.seed, 0) * layer.amp * 0.5;

      ctx.beginPath();

      // Top edge — wavy, left to right
      for (let i = 0; i <= count; i++) {
        const xoff = layer.seed + i * xinc;
        const x = cx - length / 2 + (length / count) * i;
        const y = topBaseY + noise2D(xoff, time + layer.seed) * layer.amp + sway;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (layer.isLast) {
        // Last wave — wavy bottom edge (ribbon)
        const botBaseY = topBaseY + 40;
        for (let i = count; i >= 0; i--) {
          const xoff = layer.seed + 50 + i * xinc;
          const x = cx - length / 2 + (length / count) * i;
          const y = botBaseY + noise2D(xoff, time + layer.seed + 10) * layer.amp + sway;
          ctx.lineTo(x, y);
        }
      } else {
        // Flat bottom extending to the middle of the last wave
        const lastWaveMid = h * 0.56 + 20;
        const rightX = cx + length / 2;
        const leftX = cx - length / 2;
        ctx.lineTo(rightX, lastWaveMid);
        ctx.lineTo(leftX, lastWaveMid);
      }

      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
    }

    function loop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (const layer of layers) {
        wave(layer);
      }

      time += 0.003;
      animationId = requestAnimationFrame(loop);
    }

    resize();
    loop();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 w-full pointer-events-none"
      style={{ height: "400px", bottom: "-200px", zIndex: 5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
