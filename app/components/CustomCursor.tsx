'use client';

import { useEffect, useState } from 'react';

const CURSOR_IMAGE = '/assets/tv/mouse-bag-cursor-64.png';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <img
      alt=""
      aria-hidden="true"
      className={`pointer-events-none fixed z-[9999] hidden h-16 w-16 select-none transition-transform duration-75 md:block ${
        isPressed ? 'scale-90' : 'scale-100'
      }`}
      src={CURSOR_IMAGE}
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-48px, -8px) ${isPressed ? 'scale(0.9)' : 'scale(1)'}`,
      }}
    />
  );
}
