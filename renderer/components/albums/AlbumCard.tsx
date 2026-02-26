'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Disc3 } from 'lucide-react';
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
  trackCount,
}: AlbumCardProps) {
  const coverSrc = coverSmall || coverUrl;
  const year = formatYear(releaseDate);

  return (
    <Link href={`/albums/${id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="group rounded-lg border border-border-subtle bg-surface-secondary overflow-hidden
                   hover:border-accent/25 hover:shadow-[0_6px_24px_rgba(0,0,0,0.4)]
                   transition-all duration-300 cursor-pointer"
      >
        {/* Cover */}
        <div className="relative aspect-square overflow-hidden bg-surface-tertiary">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-foreground-tertiary/20" />
            </div>
          )}

          {/* Track count badge */}
          {trackCount != null && trackCount > 0 && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium
                             bg-black/60 text-foreground/80 backdrop-blur-sm border border-white/5 tabular-nums">
              {trackCount} tr
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-2.5 py-2">
          <h3 className="text-xs font-medium text-foreground truncate leading-snug
                         group-hover:text-accent transition-colors duration-200">
            {title}
          </h3>
          <p className="text-[11px] text-foreground-tertiary truncate leading-snug mt-0.5">
            {artistName}{year ? ` \u00B7 ${year}` : ''}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
