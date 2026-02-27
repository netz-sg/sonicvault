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
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export function ArtistDiscography({ albums }: ArtistDiscographyProps) {
  if (albums.length === 0) {
    return (
      <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }} className="text-center">
        <div
          className="mx-auto rounded-full flex items-center justify-center"
          style={{
            width: '3.5rem',
            height: '3.5rem',
            background: 'rgba(232,168,73,0.06)',
            border: '1px solid rgba(232,168,73,0.08)',
            marginBottom: '0.75rem',
          }}
        >
          <Disc3 className="w-6 h-6 text-accent/25" />
        </div>
        <p className="text-sm text-foreground-tertiary">No albums in library yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 className="font-heading text-xl text-foreground">Discography</h2>
        <span
          className="font-mono text-[11px] tabular-nums text-foreground-tertiary rounded-md"
          style={{
            padding: '0.2rem 0.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginTop: '0.15rem',
          }}
        >
          {albums.length}
        </span>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {albums.map((album) => (
          <motion.div key={album.id} variants={fadeUp}>
            <DiscographyCard album={album} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function DiscographyCard({ album }: { album: Album }) {
  const coverSrc = album.coverSmall || album.coverUrl;
  const year = formatYear(album.releaseDate);
  const topGenre = album.genres[0] ?? null;

  return (
    <Link href={`/albums/${album.id}`}>
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
              alt={album.title}
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

          {/* Bottom gradient fade */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '40%',
              background: 'linear-gradient(to top, #0E0E12 0%, transparent 100%)',
            }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Year badge (top-right) */}
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

          {/* Type badge (top-left) */}
          {album.type && (
            <span
              className="absolute top-2.5 left-2.5 rounded text-[10px] font-medium uppercase tracking-wide
                         text-foreground/60 backdrop-blur-md"
              style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(0,0,0,0.55)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {album.type}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0.75rem' }}>
          <h3 className="text-sm font-medium text-foreground truncate leading-tight
                         group-hover:text-accent transition-colors duration-200">
            {album.title}
          </h3>

          {/* Track count */}
          <div className="flex items-center mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-foreground-tertiary">
              <Music className="w-3 h-3" />
              <span className="font-mono tabular-nums">{album.trackCount}</span>
            </span>
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
