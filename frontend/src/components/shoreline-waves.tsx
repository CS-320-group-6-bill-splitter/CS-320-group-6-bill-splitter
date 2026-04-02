"use client";

import { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

interface WaveLayer {
  color: string;
  baseY: number;
  thickness: number;
  seed: number;
  amp: number;
  speed: number;
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
      { color: "hsl(195, 80%, 12%)", baseY: 0.02, thickness: 70, seed: 0, amp: 28, speed: 0.003 },
      { color: "hsl(195, 78%, 16%)", baseY: 0.05, thickness: 65, seed: 40, amp: 30, speed: 0.0025 },
      { color: "hsl(195, 75%, 20%)", baseY: 0.08, thickness: 65, seed: 80, amp: 28, speed: 0.0035 },
      { color: "hsl(195, 70%, 25%)", baseY: 0.12, thickness: 60, seed: 120, amp: 26, speed: 0.003 },
      { color: "hsl(195, 65%, 30%)", baseY: 0.16, thickness: 58, seed: 160, amp: 25, speed: 0.004 },
      { color: "hsl(195, 60%, 36%)", baseY: 0.20, thickness: 55, seed: 200, amp: 24, speed: 0.003 },
      { color: "hsl(195, 55%, 42%)", baseY: 0.24, thickness: 55, seed: 240, amp: 22, speed: 0.0035 },
      { color: "hsl(195, 50%, 48%)", baseY: 0.28, thickness: 50, seed: 280, amp: 20, speed: 0.004 },
      { color: "hsl(195, 45%, 55%)", baseY: 0.33, thickness: 50, seed: 320, amp: 18, speed: 0.003 },
      // White foam / shore break
      { color: "hsla(0, 0%, 100%, 0.6)", baseY: 0.38, thickness: 15, seed: 370, amp: 12, speed: 0.005 },
      { color: "hsla(0, 0%, 100%, 0.35)", baseY: 0.42, thickness: 10, seed: 390, amp: 10, speed: 0.006 },
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
      const length = w + 20;
      const cx = w / 2;
      const topBaseY = h * layer.baseY;
      const botBaseY = topBaseY + layer.thickness;
      const sway = noise2D(time * layer.speed * 100 + layer.seed, 0) * layer.amp * 0.5;

      ctx.beginPath();

      // Top edge left to right
      for (let i = 0; i <= count; i++) {
        const xoff = layer.seed + i * xinc;
        const x = cx - length / 2 + (length / count) * i;
        const y = topBaseY + noise2D(xoff, time + layer.seed) * layer.amp + sway;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Bottom edge right to left
      for (let i = count; i >= 0; i--) {
        const xoff = layer.seed + 10 + i * xinc;
        const x = cx - length / 2 + (length / count) * i;
        const y = botBaseY + noise2D(xoff, time + layer.seed + 5) * (layer.amp * 0.7) + sway;
        ctx.lineTo(x, y);
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
      style={{ height: "500px", top: "100vh", zIndex: 5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
