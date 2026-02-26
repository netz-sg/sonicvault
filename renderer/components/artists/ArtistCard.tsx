'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic2 } from 'lucide-react';

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  albumCount: number;
  trackCount: number;
  country?: string | null;
}

export function ArtistCard({
  id,
  name,
  imageUrl,
  genres,
  albumCount,
  trackCount,
  country,
}: ArtistCardProps) {
  const topGenre = genres[0] ?? null;

  return (
    <Link href={`/artists/${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative rounded-xl border border-border-subtle bg-surface-secondary
                   overflow-hidden cursor-pointer
                   hover:border-accent/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                   transition-all duration-300"
      >
        {/* Artist Image */}
        <div className="relative aspect-square overflow-hidden bg-surface-tertiary">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500
                         group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center
                            bg-linear-to-br from-surface-tertiary to-surface-elevated">
              <Mic2 className="w-10 h-10 text-foreground-tertiary/20" />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Country badge */}
          {country && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium
                             bg-black/50 text-foreground/80 backdrop-blur-sm border border-white/5">
              {country}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground truncate leading-tight
                         group-hover:text-accent transition-colors duration-200">
            {name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-foreground-tertiary tabular-nums">
              {albumCount} {albumCount === 1 ? 'Album' : 'Albums'}
            </span>
            <span className="text-foreground-tertiary/30">&middot;</span>
            <span className="text-xs text-foreground-tertiary tabular-nums">
              {trackCount} {trackCount === 1 ? 'Track' : 'Tracks'}
            </span>
          </div>

          {topGenre && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-medium
                             bg-accent/8 text-accent/70 border border-accent/10">
              {topGenre}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
