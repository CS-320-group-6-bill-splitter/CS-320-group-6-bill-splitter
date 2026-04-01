"use client";

import { useEffect, useRef } from "react";

const TWO_PI = Math.PI * 2;

class Circle {
  basePosition: { x: number; y: number };
  position: { x: number; y: number };
  speed: number;
  baseSize: number;
  size: number;
  angle: number;
  baseRadius: number;
  bounceRadius: number;
  angleCircle: number;

  constructor(
    x: number,
    y: number,
    baseRadius: number,
    bounceRadius: number,
    angleCircle: number
  ) {
    this.basePosition = { x, y };
    this.position = { x, y };
    this.speed = 0.01;
    this.baseSize = 10;
    this.size = 10;
    this.angle = y;
    this.baseRadius = baseRadius;
    this.bounceRadius = bounceRadius;
    this.angleCircle = angleCircle;
  }

  update() {
    this.position.x =
      this.basePosition.x +
      Math.cos(this.angleCircle) *
        (Math.sin(this.angle + this.angleCircle) * this.bounceRadius +
          this.baseRadius);
    this.position.y =
      this.basePosition.y +
      Math.sin(this.angleCircle) *
        (Math.sin(this.angle + this.angleCircle) * this.bounceRadius +
          this.baseRadius);
    this.size = Math.cos(this.angle) * 8 + this.baseSize;
    this.angle += this.speed;
  }

  render(context: CanvasRenderingContext2D) {
    context.fillStyle = "hsl(195, 100%, " + this.size * 4 + "%)";
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.size, 0, TWO_PI);
    context.fill();
  }
}

class CircleContainer {
  context: CanvasRenderingContext2D;
  position: { x: number; y: number };
  numberOfCircles: number;
  circles: Circle[];
  baseRadius: number;
  bounceRadius: number;
  singleSlice: number;

  constructor(context: CanvasRenderingContext2D, x: number, y: number) {
    this.context = context;
    this.position = { x, y };
    this.numberOfCircles = 19;
    this.circles = [];
    this.baseRadius = 20;
    this.bounceRadius = 150;
    this.singleSlice = TWO_PI / this.numberOfCircles;
  }

  initializeCircles() {
    for (let i = 0; i < this.numberOfCircles; i++) {
      this.circles.push(
        new Circle(
          this.position.x,
          this.position.y + Math.random(),
          this.baseRadius,
          this.bounceRadius,
          i * this.singleSlice
        )
      );
    }
  }

  update() {
    for (let i = 0; i < this.numberOfCircles; i++) {
      this.circles[i].update();
    }
  }

  render() {
    for (let i = 0; i < this.numberOfCircles; i++) {
      this.circles[i].render(this.context);
    }
  }
}

export function SeaWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationId: number;
    let circleContainers: CircleContainer[] = [];

    function resize() {
      if (!canvas || !context) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      circleContainers = [];

      for (let x = 0; x < canvas.width + 100; x += 100) {
        for (let y = 0; y < canvas.height + 100; y += 100) {
          const container = new CircleContainer(context, x, y);
          container.initializeCircles();
          circleContainers.push(container);
        }
      }
    }

    function loop() {
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < circleContainers.length; i++) {
        circleContainers[i].update();
        circleContainers[i].render();
      }

      animationId = window.requestAnimationFrame(loop);
    }

    resize();
    loop();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      {/* SVG Goo filter */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        className="absolute h-0 w-0"
      >
        <defs>
          <filter id="shadowed-goo">
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation="10"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feGaussianBlur in="goo" stdDeviation="3" result="shadow" />
            <feColorMatrix
              in="shadow"
              mode="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.2"
              result="shadow"
            />
            <feOffset in="shadow" dx="1" dy="1" result="shadow" />
            <feBlend in2="shadow" in="goo" result="goo" />
            <feBlend in2="goo" in="SourceGraphic" result="mix" />
          </filter>
        </defs>
      </svg>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "url(#shadowed-goo)" }}
      />
    </>
  );
}
