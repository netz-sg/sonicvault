'use client';

import { useRef, useState, useCallback } from 'react';

interface CursorGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowSize?: number;
}

export function CursorGlow({
  children,
  className = '',
  glowColor = 'var(--accent-glow)',
  glowSize = 350,
}: CursorGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(${glowSize}px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 70%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      {children}
    </div>
  );
}
