'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Disc3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlbumHeader } from '@/components/albums/AlbumHeader';
import { TrackList } from '@/components/albums/TrackList';

interface AlbumDetail {
  id: string;
  title: string;
  releaseDate: string | null;
  type: string | null;
  label: string | null;
  country: string | null;
  coverUrl: string | null;
  coverSmall: string | null;
  genres: string[];
  metadataStatus: string;
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
  tracks: Array<{
    id: string;
    title: string;
    trackNumber: number | null;
    discNumber: number | null;
    durationMs: number | null;
    filePath: string | null;
    fileFormat: string | null;
    bitrate: number | null;
    lyricsPlain: string | null;
    lyricsSynced: string | null;
  }>;
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const { data: album, isLoading, error } = useQuery<AlbumDetail>({
    queryKey: ['album', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${params.id}`);
      if (!res.ok) throw new Error('Album not found');
      return res.json();
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/albums/${params.id}/refresh`, { method: 'POST' });
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', params.id] });
    },
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ gap: '2rem' }}>
        {/* Back link skeleton */}
        <div className="h-4 w-20 rounded bg-surface-tertiary" />

        {/* Header skeleton: cover + info */}
        <div className="flex flex-col sm:flex-row" style={{ gap: '1.5rem' }}>
          <div
            className="shrink-0 rounded-2xl animate-shimmer
                       bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary bg-size-[200%_100%]"
            style={{ width: '14rem', height: '14rem' }}
          />
          <div className="flex-1 flex flex-col" style={{ gap: '0.75rem', paddingTop: '0.5rem' }}>
            <div className="h-3 w-16 rounded bg-surface-tertiary" />
            <div className="h-8 w-72 rounded bg-surface-tertiary" />
            <div className="h-4 w-32 rounded bg-surface-tertiary" />
            <div className="flex gap-3 mt-1">
              <div className="h-4 w-20 rounded bg-surface-tertiary" />
              <div className="h-4 w-24 rounded bg-surface-tertiary" />
              <div className="h-4 w-16 rounded bg-surface-tertiary" />
            </div>
            <div className="flex gap-1.5 mt-1">
              <div className="h-6 w-16 rounded-full bg-surface-tertiary" />
              <div className="h-6 w-20 rounded-full bg-surface-tertiary" />
            </div>
          </div>
        </div>

        {/* Track list skeleton */}
        <div className="flex flex-col" style={{ gap: '1rem' }}>
          <div className="h-6 w-28 rounded bg-surface-tertiary" />
          <div
            className="rounded-xl border border-border-subtle overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
          >
            <div
              className="flex items-center border-b border-border-subtle"
              style={{ padding: '0.625rem 1rem' }}
            >
              <div className="h-3 w-6 rounded bg-surface-tertiary" />
              <div className="h-3 w-16 rounded bg-surface-tertiary" style={{ marginLeft: '1rem' }} />
              <div className="h-3 w-12 rounded bg-surface-tertiary ml-auto" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center border-b border-border-subtle"
                style={{ padding: '0.75rem 1rem' }}
              >
                <div className="h-3 w-4 rounded bg-surface-tertiary" />
                <div
                  className="h-3 rounded bg-surface-tertiary"
                  style={{ marginLeft: '1rem', width: `${40 + Math.random() * 30}%` }}
                />
                <div className="h-3 w-10 rounded bg-surface-tertiary ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !album) {
    return (
      <div>
        <Link
          href="/albums"
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
          Back to Albums
        </Link>
        <EmptyState
          icon={Disc3}
          title="Album not found"
          description="This album doesn't exist in your library."
        />
      </div>
    );
  }

  const totalDurationMs = album.tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const hasMultipleDiscs = album.tracks.some((t) => (t.discNumber ?? 1) > 1);

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
        href="/albums"
        className="group inline-flex items-center gap-2 text-sm text-foreground-tertiary hover:text-accent transition-colors"
      >
        <span
          className="flex items-center justify-center rounded-lg bg-surface-secondary border border-border-subtle
                     group-hover:border-accent/20 transition-colors"
          style={{ width: '1.75rem', height: '1.75rem' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        <span className="font-medium">Albums</span>
      </Link>

      {/* Header */}
      <AlbumHeader
        title={album.title}
        coverUrl={album.coverUrl}
        artistName={album.artist?.name ?? null}
        artistId={album.artist?.id ?? null}
        releaseDate={album.releaseDate}
        type={album.type}
        label={album.label}
        country={album.country}
        genres={album.genres}
        trackCount={album.tracks.length}
        totalDurationMs={totalDurationMs}
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={refreshMutation.isPending}
      />

      {/* Track List */}
      <TrackList
        tracks={album.tracks}
        hasMultipleDiscs={hasMultipleDiscs}
        selectedTrackId={selectedTrackId}
        onSelectTrack={(id) => setSelectedTrackId(id === selectedTrackId ? null : id)}
      />
    </motion.div>
  );
}
