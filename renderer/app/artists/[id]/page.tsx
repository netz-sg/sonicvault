'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mic2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArtistHero } from '@/components/artists/ArtistHero';
import { ArtistDiscography } from '@/components/artists/ArtistDiscography';

interface ArtistDetail {
  id: string;
  name: string;
  sortName: string | null;
  type: string | null;
  country: string | null;
  beginDate: string | null;
  endDate: string | null;
  biography: string | null;
  imageUrl: string | null;
  backgroundUrl: string | null;
  genres: string[];
  tags: string[];
  metadataStatus: string;
  albums: Array<{
    id: string;
    title: string;
    releaseDate: string | null;
    type: string | null;
    coverUrl: string | null;
    coverSmall: string | null;
    trackCount: number;
    genres: string[];
  }>;
}

export default function ArtistDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: artist, isLoading, error } = useQuery<ArtistDetail>({
    queryKey: ['artist', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/artists/${params.id}`);
      if (!res.ok) throw new Error('Artist not found');
      return res.json();
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/artists/${params.id}/refresh`, { method: 'POST' });
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist', params.id] });
    },
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ gap: '2rem' }}>
        {/* Back link skeleton */}
        <div className="h-4 w-20 rounded bg-surface-tertiary" />

        {/* Banner skeleton */}
        <div
          className="rounded-2xl overflow-hidden animate-shimmer
                     bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary bg-size-[200%_100%]"
          style={{ height: '18rem' }}
        />

        {/* Overlapping content skeleton */}
        <div className="flex items-start" style={{ gap: '1.5rem', marginTop: '-4rem', paddingLeft: '1.5rem' }}>
          <div
            className="shrink-0 rounded-2xl bg-surface-secondary border-2 border-surface"
            style={{ width: '10rem', height: '10rem' }}
          />
          <div className="flex-1 flex flex-col" style={{ gap: '0.75rem', paddingTop: '3rem' }}>
            <div className="h-3 w-16 rounded bg-surface-tertiary" />
            <div className="h-8 w-64 rounded bg-surface-tertiary" />
            <div className="flex gap-3 mt-1">
              <div className="h-4 w-20 rounded bg-surface-tertiary" />
              <div className="h-4 w-24 rounded bg-surface-tertiary" />
              <div className="h-4 w-16 rounded bg-surface-tertiary" />
            </div>
          </div>
        </div>

        {/* Discography skeleton */}
        <div className="flex flex-col" style={{ gap: '1rem', marginTop: '1rem' }}>
          <div className="h-6 w-40 rounded bg-surface-tertiary" />
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !artist) {
    return (
      <div>
        <Link
          href="/artists"
          className="group inline-flex items-center gap-2 text-sm text-foreground-tertiary hover:text-accent transition-colors"
          style={{ marginBottom: '2rem' }}
        >
          <span
            className="flex items-center justify-center rounded-lg bg-surface-secondary border border-border-subtle
                       group-hover:border-accent/20 transition-colors"
            style={{ width: '1.75rem', height: '1.75rem' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Back to Artists
        </Link>
        <EmptyState
          icon={Mic2}
          title="Artist not found"
          description="This artist doesn't exist in your library."
        />
      </div>
    );
  }

  const totalTracks = artist.albums.reduce((sum, a) => sum + a.trackCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col"
      style={{ gap: '2rem' }}
    >
      {/* Back link */}
      <Link
        href="/artists"
        className="group inline-flex items-center gap-2 text-sm text-foreground-tertiary hover:text-accent transition-colors"
      >
        <span
          className="flex items-center justify-center rounded-lg bg-surface-secondary border border-border-subtle
                     group-hover:border-accent/20 transition-colors"
          style={{ width: '1.75rem', height: '1.75rem' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        <span className="font-medium">Artists</span>
      </Link>

      {/* Hero */}
      <ArtistHero
        name={artist.name}
        imageUrl={artist.imageUrl}
        backgroundUrl={artist.backgroundUrl}
        biography={artist.biography}
        country={artist.country}
        beginDate={artist.beginDate}
        endDate={artist.endDate}
        type={artist.type}
        genres={artist.genres}
        albumCount={artist.albums.length}
        trackCount={totalTracks}
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={refreshMutation.isPending}
      />

      {/* Discography */}
      <ArtistDiscography albums={artist.albums} />
    </motion.div>
  );
}
