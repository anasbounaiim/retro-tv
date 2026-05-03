'use client';

import { useEffect, useRef } from 'react';

interface StaticOverlayProps {
  isActive: boolean;
  intensity?: number;
}

export function StaticOverlay({ isActive, intensity = 0.3 }: StaticOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let animationFrameId = 0;
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() > 0.5 ? 255 : 0;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = Math.floor(210 + 45 * intensity);   // A
      }

      ctx.putImageData(imageData, 0, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

      for (let i = 0; i < 5; i += 1) {
        const y = Math.floor(Math.random() * canvas.height);
        ctx.fillRect(0, y, canvas.width, 1);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-20 bg-black pointer-events-none contrast-200 brightness-125 transition-opacity duration-150 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      width={800}
      height={450}
    />
  );
}
