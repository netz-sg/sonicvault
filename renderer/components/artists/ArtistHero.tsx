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
      {/* Background Banner — cinematic with multi-stop gradient */}
      <div className="relative overflow-hidden rounded-2xl" style={{ height: '18rem' }}>
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
            className="w-full h-full object-cover blur-3xl scale-125 opacity-25"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1A1A21 0%, #111115 40%, rgba(232,168,73,0.04) 100%)',
            }}
          />
        )}

        {/* Multi-stop cinematic gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to top,
              #0A0A0C 0%,
              rgba(10,10,12,0.95) 15%,
              rgba(10,10,12,0.6) 40%,
              rgba(10,10,12,0.3) 65%,
              rgba(10,10,12,0.15) 100%
            )`,
          }}
        />

        {/* Subtle warm tint at top edge */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: '30%',
            background: 'linear-gradient(to bottom, rgba(232,168,73,0.03) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Content overlapping the banner */}
      <div className="relative" style={{ marginTop: '-5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div className="flex flex-col sm:flex-row items-start" style={{ gap: '1.5rem' }}>
          {/* Artist Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: '10rem',
              height: '10rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.04), 0 0 20px rgba(232,168,73,0.06)',
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
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
                  <Mic2 className="w-8 h-8 text-accent/25" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0"
            style={{ paddingTop: '2.5rem' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {/* Type badge */}
                {type && (
                  <span
                    className="inline-block text-[10px] uppercase tracking-widest font-medium text-foreground-tertiary rounded"
                    style={{
                      padding: '0.15rem 0.5rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {type}
                  </span>
                )}

                <h1
                  className="font-heading text-foreground tracking-tight"
                  style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
                >
                  {name}
                </h1>
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="shrink-0 rounded-lg bg-surface-secondary border border-border-subtle
                           text-foreground-tertiary hover:text-accent hover:border-accent/30 transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '0.5rem' }}
                title="Re-fetch metadata for this artist"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center mt-3" style={{ gap: '0.75rem' }}>
              {country && (
                <span className="flex items-center gap-1 text-xs text-foreground-secondary">
                  <MapPin className="w-3 h-3 text-foreground-tertiary" />
                  {country}
                </span>
              )}
              {beginDate && (
                <span className="flex items-center gap-1 text-xs text-foreground-secondary">
                  <Calendar className="w-3 h-3 text-foreground-tertiary" />
                  <span className="font-mono tabular-nums">
                    {beginDate}{endDate ? ` — ${endDate}` : ''}
                  </span>
                </span>
              )}

              {/* Separator dot before stats */}
              {(country || beginDate) && (
                <span className="text-foreground-tertiary/30">|</span>
              )}

              {/* Stat chips */}
              <span
                className="inline-flex items-center gap-1 text-xs text-foreground-secondary rounded"
                style={{
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Disc3 className="w-3 h-3 text-foreground-tertiary" />
                <span className="font-mono tabular-nums">{albumCount}</span>
                <span className="text-foreground-tertiary">album{albumCount !== 1 ? 's' : ''}</span>
              </span>
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
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {genres.slice(0, 8).map((genre) => (
                  <GenreTag key={genre} genre={genre} size="md" />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Biography */}
        {biography && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="relative rounded-xl overflow-hidden"
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: '3px',
                background: 'linear-gradient(to bottom, rgba(232,168,73,0.5) 0%, rgba(232,168,73,0.1) 100%)',
                borderRadius: '0 2px 2px 0',
              }}
            />

            <h2
              className="text-[10px] uppercase tracking-widest text-foreground-tertiary font-medium"
              style={{ marginBottom: '0.5rem' }}
            >
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
