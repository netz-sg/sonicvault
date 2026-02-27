'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Disc3, Music } from 'lucide-react';
import { formatYear } from '@/lib/utils/format';

interface AlbumCardProps {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  coverSmall: string | null;
  releaseDate: string | null;
  genres: string[];
  trackCount: number | null;
}

export function AlbumCard({
  id,
  title,
  artistName,
  coverUrl,
  coverSmall,
  releaseDate,
  genres,
  trackCount,
}: AlbumCardProps) {
  const coverSrc = coverSmall || coverUrl;
  const year = formatYear(releaseDate);
  const topGenre = genres[0] ?? null;

  return (
    <Link href={`/albums/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative rounded-xl overflow-hidden cursor-pointer border border-border-subtle
                   hover:border-accent/20 transition-colors duration-300"
        style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
      >
        {/* Cover */}
        <div className="relative aspect-square overflow-hidden bg-surface-tertiary">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500
                         group-hover:scale-[1.06]"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1A1A21 0%, #111115 50%, #1A1A21 100%)',
              }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: 'rgba(232,168,73,0.06)',
                  border: '1px solid rgba(232,168,73,0.08)',
                }}
              >
                <Disc3 className="w-6 h-6 text-accent/25" />
              </div>
            </div>
          )}

          {/* Bottom gradient fade into card body */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '40%',
              background: 'linear-gradient(to top, #0E0E12 0%, transparent 100%)',
            }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Year badge */}
          {year && (
            <span
              className="absolute top-2.5 right-2.5 rounded text-[10px] font-mono font-medium tracking-wide
                         text-foreground/70 backdrop-blur-md"
              style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {year}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0.75rem' }}>
          <h3 className="text-sm font-medium text-foreground truncate leading-tight
                         group-hover:text-accent transition-colors duration-200">
            {title}
          </h3>

          {/* Artist + track count row */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-foreground-tertiary truncate" style={{ maxWidth: '70%' }}>
              {artistName}
            </span>
            {trackCount != null && trackCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-foreground-tertiary shrink-0">
                <Music className="w-3 h-3" />
                <span className="font-mono tabular-nums">{trackCount}</span>
              </span>
            )}
          </div>

          {/* Genre tag */}
          {topGenre && (
            <div className="mt-2">
              <span
                className="inline-block rounded text-[10px] font-medium text-accent/60"
                style={{
                  padding: '0.15rem 0.4rem',
                  background: 'rgba(232,168,73,0.06)',
                  border: '1px solid rgba(232,168,73,0.08)',
                }}
              >
                {topGenre}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
