'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Disc3, Music } from 'lucide-react';
import { formatYear } from '@/lib/utils/format';

interface Album {
  id: string;
  title: string;
  releaseDate: string | null;
  type: string | null;
  coverUrl: string | null;
  coverSmall: string | null;
  trackCount: number;
  genres: string[];
}

interface ArtistDiscographyProps {
  albums: Album[];
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export function ArtistDiscography({ albums }: ArtistDiscographyProps) {
  if (albums.length === 0) {
    return (
      <div className="py-8 text-center">
        <Disc3 className="w-8 h-8 text-foreground-tertiary/30 mx-auto mb-2" />
        <p className="text-sm text-foreground-tertiary">No albums in library yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl text-foreground mb-4">
        Discography
        <span className="ml-2 text-sm font-sans text-foreground-tertiary font-normal">
          {albums.length} album{albums.length !== 1 ? 's' : ''}
        </span>
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        {albums.map((album) => (
          <motion.div key={album.id} variants={fadeUp}>
            <AlbumCard album={album} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function AlbumCard({ album }: { album: Album }) {
  const coverSrc = album.coverSmall || album.coverUrl;

  return (
    <Link href={`/albums/${album.id}`}>
      <div className="group rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden
                      hover:border-accent/20 hover:shadow-[var(--shadow-card)] transition-all duration-300">
        {/* Cover */}
        <div className="relative aspect-square overflow-hidden bg-surface-tertiary">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-10 h-10 text-foreground-tertiary/20" />
            </div>
          )}
          {/* Type badge */}
          {album.type && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase
                             bg-surface/80 text-foreground-tertiary backdrop-blur-sm border border-border-subtle">
              {album.type}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
            {album.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground-tertiary">
            <span>{formatYear(album.releaseDate)}</span>
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {album.trackCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
