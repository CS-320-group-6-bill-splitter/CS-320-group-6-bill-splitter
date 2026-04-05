"use client";

import { useEffect, useRef } from "react";

interface WetSandOverlayProps {
  dryLine: number; // 0 = fully wet, 150 = fully dry
}

export function WetSandOverlay({ dryLine }: WetSandOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      if (dryLine >= 150) return;

      // Edge position — dryLine=0: edge at bottom (fully wet above), dryLine=150: edge above screen (fully dry)
      const edgeY = h + h * 0.3 - (dryLine / 100) * h;

      const time = performance.now() / 1000;
      const points: number[] = [];
      const segments = 200;

      // Generate smooth wavy edge points
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const wave1 = Math.sin(x * 0.008 + time * 0.4) * 18;
        const wave2 = Math.sin(x * 0.015 + time * 0.25 + 1.5) * 12;
        const wave3 = Math.sin(x * 0.003 + time * 0.15 + 4) * 8;
        points.push(edgeY + wave1 + wave2 + wave3);
      }

      // Draw wet sand from top down to wavy edge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);

      // Wavy edge right to left
      ctx.lineTo(w, points[points.length - 1]);
      for (let i = points.length - 2; i >= 1; i--) {
        const x = (i / segments) * w;
        const nextX = ((i + 1) / segments) * w;
        const midX = (x + nextX) / 2;
        const midY = (points[i] + points[i + 1]) / 2;
        ctx.quadraticCurveTo(nextX, points[i + 1], midX, midY);
      }
      ctx.lineTo(0, points[0]);
      ctx.closePath();

      ctx.fillStyle = "#7a6528";
      ctx.fill();

      // Soft feather below the edge — multiple gradient bands for smooth blend
      const featherHeight = 120;
      const bands = 8;
      for (let b = 0; b < bands; b++) {
        const bandTop = (b / bands) * featherHeight;
        const bandBot = ((b + 1) / bands) * featherHeight;
        const alphaTop = 0.5 * (1 - b / bands);
        const alphaBot = 0.5 * (1 - (b + 1) / bands);

        ctx.beginPath();
        // Top wavy edge offset by bandTop
        ctx.moveTo(0, points[0] + bandTop);
        for (let i = 1; i < points.length; i++) {
          const x = (i / segments) * w;
          const prevX = ((i - 1) / segments) * w;
          const midX = (prevX + x) / 2;
          const midY = (points[i - 1] + points[i]) / 2;
          ctx.quadraticCurveTo(prevX, points[i - 1] + bandTop, midX, midY + bandTop);
        }
        // Bottom wavy edge offset by bandBot
        ctx.lineTo(w, points[points.length - 1] + bandBot);
        for (let i = points.length - 2; i >= 1; i--) {
          const x = (i / segments) * w;
          const nextX = ((i + 1) / segments) * w;
          const midX = (x + nextX) / 2;
          const midY = (points[i] + points[i + 1]) / 2;
          ctx.quadraticCurveTo(nextX, points[i + 1] + bandBot, midX, midY + bandBot);
        }
        ctx.lineTo(0, points[0] + bandBot);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, edgeY + bandTop, 0, edgeY + bandBot);
        grad.addColorStop(0, `rgba(122, 101, 40, ${alphaTop})`);
        grad.addColorStop(1, `rgba(122, 101, 40, ${alphaBot})`);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    draw();
  }, [dryLine]);

  if (dryLine >= 150) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
