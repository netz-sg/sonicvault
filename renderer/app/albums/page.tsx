'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Disc3, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { AlbumCard } from '@/components/albums/AlbumCard';

interface AlbumListItem {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  coverSmall: string | null;
  releaseDate: string | null;
  genres: string[];
  trackCount: number | null;
}

interface AlbumListResponse {
  items: AlbumListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function AlbumsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<AlbumListResponse>({
    queryKey: ['albums', search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '48' });
      if (search) params.set('search', search);
      return fetch(`/api/albums?${params}`).then((r) => r.json());
    },
  });

  const albums = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col" style={{ gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          <h1 className="font-heading text-3xl text-foreground tracking-tight">Albums</h1>
          {total > 0 && (
            <span
              className="font-mono text-[11px] tabular-nums text-foreground-tertiary rounded-md"
              style={{
                padding: '0.2rem 0.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginTop: '0.3rem',
              }}
            >
              {total}
            </span>
          )}
        </div>
        <SearchInput
          placeholder="Search albums..."
          value={search}
          onChange={handleSearch}
          className="sm:w-72"
        />
      </div>

      {/* Search active indicator */}
      {search && !isLoading && albums.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-tertiary">
            {total} result{total !== 1 ? 's' : ''} for
          </span>
          <span
            className="text-xs font-medium text-accent rounded"
            style={{
              padding: '0.15rem 0.4rem',
              background: 'rgba(232,168,73,0.08)',
              border: '1px solid rgba(232,168,73,0.1)',
            }}
          >
            {search}
          </span>
          <button
            onClick={() => handleSearch('')}
            className="text-[11px] text-foreground-tertiary hover:text-foreground transition-colors"
            style={{ marginLeft: '0.25rem' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-subtle overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
            >
              <div
                className="aspect-square bg-surface-tertiary animate-shimmer
                            bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary bg-size-[200%_100%]"
              />
              <div style={{ padding: '0.75rem' }}>
                <div className="h-3.5 w-3/4 rounded bg-surface-tertiary" />
                <div className="h-2.5 w-1/2 rounded bg-surface-tertiary mt-2" />
                <div className="h-2 w-1/3 rounded bg-surface-tertiary mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && albums.length === 0 && (
        <EmptyState
          icon={Disc3}
          title={search ? 'No albums found' : 'No albums yet'}
          description={
            search
              ? `No albums match "${search}". Try a different search term.`
              : 'Albums will appear here after you scan your music folders.'
          }
        />
      )}

      {/* Album Grid */}
      {!isLoading && albums.length > 0 && (
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
              <AlbumCard
                id={album.id}
                title={album.title}
                artistName={album.artistName}
                coverUrl={album.coverUrl}
                coverSmall={album.coverSmall}
                releaseDate={album.releaseDate}
                genres={album.genres}
                trackCount={album.trackCount}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center" style={{ paddingTop: '0.5rem', gap: '0.5rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-9 h-9 rounded-lg flex items-center justify-center
                       bg-surface-secondary border border-border-subtle text-foreground-secondary
                       hover:text-foreground hover:border-accent/20 transition-all
                       disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {buildPageNumbers(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="text-xs text-foreground-tertiary px-1">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(Number(p))}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium
                           border transition-all ${
                             page === p
                               ? 'bg-accent/10 text-accent border-accent/20'
                               : 'bg-surface-secondary border-border-subtle text-foreground-tertiary hover:text-foreground hover:border-accent/15'
                           }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-9 h-9 rounded-lg flex items-center justify-center
                       bg-surface-secondary border border-border-subtle text-foreground-secondary
                       hover:text-foreground hover:border-accent/20 transition-all
                       disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// -- Pagination helper --

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
