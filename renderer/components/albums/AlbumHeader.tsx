'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Disc3, Music, Calendar, Tag, MapPin, RefreshCw } from 'lucide-react';
import { formatYear, formatDurationLong } from '@/lib/utils/format';
import { GenreTag } from '@/components/ui/GenreTag';

interface AlbumHeaderProps {
  title: string;
  coverUrl: string | null;
  artistName: string | null;
  artistId: string | null;
  releaseDate: string | null;
  type: string | null;
  label: string | null;
  country: string | null;
  genres: string[];
  trackCount: number;
  totalDurationMs: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AlbumHeader({
  title,
  coverUrl,
  artistName,
  artistId,
  releaseDate,
  type,
  label,
  country,
  genres,
  trackCount,
  totalDurationMs,
  onRefresh,
  isRefreshing,
}: AlbumHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row" style={{ gap: '1.5rem' }}>
      {/* Cover Art */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="shrink-0 rounded-2xl overflow-hidden"
        style={{
          width: '14rem',
          height: '14rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 20px rgba(232,168,73,0.06)',
        }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
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
                width: '4rem',
                height: '4rem',
                background: 'rgba(232,168,73,0.06)',
                border: '1px solid rgba(232,168,73,0.08)',
              }}
            >
              <Disc3 className="w-8 h-8 text-accent/25" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 min-w-0 flex flex-col justify-end"
      >
        {/* Type badge */}
        {type && (
          <span
            className="inline-block text-[10px] uppercase tracking-widest font-medium text-foreground-tertiary rounded"
            style={{
              padding: '0.15rem 0.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '0.5rem',
              width: 'fit-content',
            }}
          >
            {type}
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <h1
            className="font-heading text-foreground tracking-tight"
            style={{ fontSize: '2.25rem', lineHeight: 1.1 }}
          >
            {title}
          </h1>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="shrink-0 rounded-lg bg-surface-secondary border border-border-subtle
                       text-foreground-tertiary hover:text-accent hover:border-accent/30 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: '0.5rem' }}
            title="Re-fetch metadata for this album"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Artist Link */}
        {artistName && (
          <p className="text-sm text-foreground-secondary mt-1">
            by{' '}
            {artistId ? (
              <Link
                href={`/artists/${artistId}`}
                className="font-medium text-accent hover:text-accent-dark transition-colors"
              >
                {artistName}
              </Link>
            ) : (
              <span className="font-medium text-foreground-secondary">{artistName}</span>
            )}
          </p>
        )}

        {/* Meta row — stat chips */}
        <div className="flex flex-wrap items-center mt-3" style={{ gap: '0.5rem' }}>
          {releaseDate && (
            <span
              className="inline-flex items-center gap-1 text-xs text-foreground-secondary rounded"
              style={{
                padding: '0.15rem 0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Calendar className="w-3 h-3 text-foreground-tertiary" />
              <span className="font-mono tabular-nums">{formatYear(releaseDate)}</span>
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 text-xs text-foreground-secondary rounded"
            style={{
              padding: '0.15rem 0.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Music className="w-3 h-3 text-foreground-tertiary" />
            <span className="font-mono tabular-nums">{trackCount}</span>
            <span className="text-foreground-tertiary">track{trackCount !== 1 ? 's' : ''}</span>
          </span>
          {totalDurationMs > 0 && (
            <span
              className="inline-flex items-center text-xs text-foreground-secondary rounded"
              style={{
                padding: '0.15rem 0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="font-mono tabular-nums">{formatDurationLong(totalDurationMs)}</span>
            </span>
          )}
          {label && (
            <span
              className="inline-flex items-center gap-1 text-xs text-foreground-secondary rounded"
              style={{
                padding: '0.15rem 0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Tag className="w-3 h-3 text-foreground-tertiary" />
              {label}
            </span>
          )}
          {country && (
            <span
              className="inline-flex items-center gap-1 text-xs text-foreground-secondary rounded"
              style={{
                padding: '0.15rem 0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <MapPin className="w-3 h-3 text-foreground-tertiary" />
              {country}
            </span>
          )}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {genres.slice(0, 6).map((genre) => (
              <GenreTag key={genre} genre={genre} size="md" />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
