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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="shrink-0 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-border-subtle
                   bg-surface-secondary shadow-[var(--shadow-deep)]"
      >
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-tertiary">
            <Disc3 className="w-16 h-16 text-foreground-tertiary/20" />
          </div>
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-end">
        {/* Type badge */}
        {type && (
          <span className="text-[11px] uppercase tracking-wider text-foreground-tertiary font-medium">
            {type}
          </span>
        )}

        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="shrink-0 mt-1 p-2 rounded-lg bg-surface-secondary border border-border-subtle
                       text-foreground-tertiary hover:text-accent hover:border-accent/30 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            title="Re-fetch metadata for this album"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Artist Link */}
        {artistName && (
          <p className="text-base text-foreground-secondary mt-1">
            by{' '}
            {artistId ? (
              <Link
                href={`/artists/${artistId}`}
                className="text-accent hover:underline underline-offset-2"
              >
                {artistName}
              </Link>
            ) : (
              artistName
            )}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-foreground-secondary">
          {releaseDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatYear(releaseDate)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {trackCount} track{trackCount !== 1 ? 's' : ''}
          </span>
          {totalDurationMs > 0 && (
            <span>{formatDurationLong(totalDurationMs)}</span>
          )}
          {label && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {label}
            </span>
          )}
          {country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {country}
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
      </div>
    </div>
  );
}
