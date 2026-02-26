'use client';

import { motion } from 'framer-motion';
import { Mic2, Disc3, Music, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { GenreTag } from '@/components/ui/GenreTag';

interface ArtistHeroProps {
  name: string;
  imageUrl: string | null;
  backgroundUrl: string | null;
  biography: string | null;
  country: string | null;
  beginDate: string | null;
  endDate: string | null;
  type: string | null;
  genres: string[];
  albumCount: number;
  trackCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ArtistHero({
  name,
  imageUrl,
  backgroundUrl,
  biography,
  country,
  beginDate,
  endDate,
  type,
  genres,
  albumCount,
  trackCount,
  onRefresh,
  isRefreshing,
}: ArtistHeroProps) {
  return (
    <div className="relative">
      {/* Background Banner */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-surface-tertiary">
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 opacity-30"
          />
        ) : null}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/60 to-transparent" />
      </div>

      {/* Content overlapping the banner */}
      <div className="relative -mt-20 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-start" style={{ gap: '1.25rem' }}>
          {/* Artist Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-4 border-surface
                       bg-surface-secondary shadow-[var(--shadow-deep)]"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-tertiary">
                <Mic2 className="w-12 h-12 text-foreground-tertiary/30" />
              </div>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                {type && (
                  <span className="text-[11px] uppercase tracking-wider text-foreground-tertiary font-medium">
                    {type}
                  </span>
                )}
                <h1 className="font-heading text-3xl sm:text-4xl text-foreground tracking-tight">
                  {name}
                </h1>
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="shrink-0 p-2 rounded-lg bg-surface-secondary border border-border-subtle
                           text-foreground-tertiary hover:text-accent hover:border-accent/30 transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
                title="Re-fetch metadata for this artist"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-foreground-secondary">
              {country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {country}
                </span>
              )}
              {beginDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {beginDate}{endDate ? ` — ${endDate}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Disc3 className="w-3 h-3" />
                {albumCount} album{albumCount !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                {trackCount} track{trackCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.slice(0, 8).map((genre) => (
                  <GenreTag key={genre} genre={genre} size="md" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Biography */}
        {biography && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-6 rounded-xl bg-surface-secondary/50 border border-border-subtle p-5"
          >
            <h2 className="text-xs uppercase tracking-wider text-foreground-tertiary font-medium mb-2">
              Biography
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed line-clamp-6">
              {biography}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
