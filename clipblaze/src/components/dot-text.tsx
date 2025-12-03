"use client";

import { useEffect, useRef } from "react";

interface DotTextProps {
  text?: string;
}

export function DotText({ text = "Go viral with ClipBlaze" }: DotTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const dotSize = 2;
      const gap = 6;
      const fontSize = Math.min(width / (text.length * 0.55), 72);

      // Draw text to sample pixels
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "white";
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);

      const imageData = ctx.getImageData(0, 0, width * dpr, height * dpr);
      const pixels = imageData.data;

      interface Dot {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        opacity: number;
        delay: number;
      }

      const dots: Dot[] = [];
      const step = (dotSize + gap) * dpr;

      for (let y = 0; y < height * dpr; y += step) {
        for (let x = 0; x < width * dpr; x += step) {
          const i = (Math.floor(y) * Math.floor(width * dpr) + Math.floor(x)) * 4;
          if (pixels[i + 3] > 128) {
            const targetX = x / dpr;
            const targetY = y / dpr;
            dots.push({
              x: targetX + (Math.random() - 0.5) * 80,
              y: targetY + (Math.random() - 0.5) * 80,
              targetX,
              targetY,
              opacity: 0,
              delay: Math.random() * 40,
            });
          }
        }
      }

      let frame = 0;
      const fearRadius = 80;
      const fearStrength = 15;

      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        const mouse = mouseRef.current;

        dots.forEach((dot) => {
          if (frame > dot.delay) {
            dot.opacity = Math.min(dot.opacity + 0.03, 0.5);
          }

          // Calculate distance from cursor
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < fearRadius && dist > 0) {
            // Push away from cursor
            const force = (fearRadius - dist) / fearRadius;
            const angle = Math.atan2(dy, dx);
            dot.x += Math.cos(angle) * force * fearStrength;
            dot.y += Math.sin(angle) * force * fearStrength;
          } else {
            // Return to target position
            dot.x += (dot.targetX - dot.x) * 0.1;
            dot.y += (dot.targetY - dot.y) * 0.1;
          }

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
          ctx.fill();
        });

        frame++;
        animationId = requestAnimationFrame(animate);
      };

      animate();
    };

    setup();
    window.addEventListener("resize", setup);

    return () => {
      window.removeEventListener("resize", setup);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [text]);

  return (
    <div className="py-12">
      <canvas
        ref={canvasRef}
        className="w-full h-24 md:h-32 cursor-default"
      />
    </div>
  );
}
