'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc3 } from 'lucide-react';
import Link from 'next/link';

interface RecentAlbum {
  id: string;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
  coverSmall: string | null;
  artistName: string;
  artistImageUrl: string | null;
  genres: string[];
  createdAt: number;
}

export function RecentAlbums() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: albums } = useQuery<RecentAlbum[]>({
    queryKey: ['recent-albums'],
    queryFn: () => fetch('/api/albums/recent?limit=8').then((r) => r.json()),
  });

  const count = albums?.length ?? 0;

  const advance = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  useEffect(() => {
    if (isPaused || count <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(advance, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, advance, count]);

  useEffect(() => {
    if (count > 0 && activeIndex >= count) {
      setActiveIndex(0);
    }
  }, [count, activeIndex]);

  if (!albums || albums.length === 0) return null;

  const album = albums[activeIndex];
  const year = album.releaseDate?.slice(0, 4) ?? null;
  const genre = album.genres?.[0] ?? null;

  return (
    <div
      className="relative rounded-xl border border-border-subtle overflow-hidden"
      style={{ height: '16rem' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Artist Background Image — full bleed, blurred */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`bg-${album.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {album.artistImageUrl ? (
            <img
              src={album.artistImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(20px) brightness(0.25) saturate(0.6)', transform: 'scale(1.1)' }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #111115 0%, #0A0A0C 50%, #111115 100%)',
              }}
            />
          )}
          {/* Dark overlays for readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(10,10,12,0.4) 0%, rgba(10,10,12,0.85) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(10,10,12,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,12,0.5) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`content-${album.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <Link
            href={`/albums/${album.id}`}
            className="absolute inset-0 flex items-stretch group"
          >
            {/* Cover Art */}
            <div className="relative shrink-0" style={{ width: '16rem' }}>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ padding: '1.5rem' }}
              >
                {album.coverUrl ? (
                  <div
                    className="relative w-full h-full rounded-lg overflow-hidden"
                    style={{
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                    }}
                  >
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-full rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(232,168,73,0.08) 0%, rgba(232,168,73,0.02) 100%)',
                      border: '1px solid rgba(232,168,73,0.1)',
                    }}
                  >
                    <Disc3 className="w-10 h-10 text-accent/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div
              className="flex-1 flex flex-col justify-center relative min-w-0"
              style={{ padding: '1.5rem 1.5rem 1.5rem 0' }}
            >
              <span
                className="text-[10px] uppercase tracking-widest font-medium"
                style={{ color: 'rgba(232,168,73,0.5)', marginBottom: '0.625rem' }}
              >
                Recently Added
              </span>

              <h3
                className="font-heading text-foreground leading-tight group-hover:text-accent transition-colors duration-300"
                style={{
                  fontSize: '1.75rem',
                  marginBottom: '0.375rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {album.title}
              </h3>

              <p
                className="text-sm font-medium text-accent truncate"
                style={{
                  marginBottom: '0.75rem',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              >
                {album.artistName}
              </p>

              <div className="flex items-center gap-2">
                {year && (
                  <span
                    className="font-mono text-[11px] tabular-nums text-foreground-secondary"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.375rem',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {year}
                  </span>
                )}
                {genre && (
                  <span
                    className="text-[11px] text-accent/80"
                    style={{
                      background: 'rgba(232,168,73,0.08)',
                      border: '1px solid rgba(232,168,73,0.12)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.375rem',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {genre}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Counter */}
      {count > 1 && (
        <div
          className="absolute top-0 right-0 z-10 font-mono text-[11px] tabular-nums"
          style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.3)' }}
        >
          {activeIndex + 1} / {count}
        </div>
      )}

      {/* Navigation Dots */}
      {count > 1 && (
        <div
          className="absolute bottom-0 right-0 z-10 flex items-center"
          style={{ padding: '0.75rem 1rem', gap: '0.375rem' }}
        >
          {albums.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '1.25rem' : '0.375rem',
                height: '0.375rem',
                background: i === activeIndex
                  ? 'var(--color-accent)'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: i === activeIndex
                  ? '0 0 8px rgba(232,168,73,0.4)'
                  : 'none',
              }}
              aria-label={`Show album ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
