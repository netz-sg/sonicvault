'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Music, MessageSquareText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDuration } from '@/lib/utils/format';

interface Track {
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
}

interface TrackListProps {
  tracks: Track[];
  hasMultipleDiscs: boolean;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export function TrackList({
  tracks,
  hasMultipleDiscs,
  selectedTrackId,
  onSelectTrack,
}: TrackListProps) {
  // Group by disc if multiple
  const grouped = hasMultipleDiscs
    ? groupByDisc(tracks)
    : [{ disc: 1, tracks }];

  return (
    <div>
      {/* Section header with count badge */}
      <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 className="font-heading text-xl text-foreground">Tracks</h2>
        <span
          className="font-mono text-[11px] tabular-nums text-foreground-tertiary rounded-md"
          style={{
            padding: '0.2rem 0.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginTop: '0.15rem',
          }}
        >
          {tracks.length}
        </span>
      </div>

      <div
        className="rounded-xl border border-border-subtle overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
      >
        {/* Table Header */}
        <div
          className="flex items-center border-b border-border-subtle text-[10px] uppercase
                      tracking-widest text-foreground-tertiary font-medium"
          style={{ padding: '0.625rem 1rem', gap: '0.75rem' }}
        >
          <span style={{ width: '2rem' }} className="text-center">#</span>
          <span className="flex-1">Title</span>
          <span style={{ width: '4rem' }} className="text-right hidden sm:block">Duration</span>
          <span style={{ width: '1.5rem' }} />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          {grouped.map((group) => (
            <div key={group.disc}>
              {/* Disc header */}
              {hasMultipleDiscs && (
                <div
                  className="border-b border-border-subtle"
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.015)',
                  }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-foreground-tertiary font-medium">
                    Disc {group.disc}
                  </span>
                </div>
              )}

              {/* Track rows */}
              {group.tracks.map((track) => {
                const isSelected = track.id === selectedTrackId;
                const hasLyrics = !!(track.lyricsPlain || track.lyricsSynced);

                return (
                  <div key={track.id}>
                    <motion.button
                      variants={fadeIn}
                      onClick={() => onSelectTrack(track.id)}
                      className={`w-full flex items-center text-left transition-all duration-150
                                  ${!isSelected ? 'border-b border-border-subtle' : ''}
                                  ${isSelected
                                    ? 'bg-accent/5'
                                    : 'hover:bg-surface-tertiary/30'
                                  }`}
                      style={{
                        padding: '0.625rem 1rem',
                        gap: '0.75rem',
                        borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                      }}
                    >
                      {/* Track number */}
                      <span
                        className={`text-center text-xs font-mono tabular-nums shrink-0 ${
                          isSelected ? 'text-accent' : 'text-foreground-tertiary'
                        }`}
                        style={{ width: '2rem' }}
                      >
                        {track.trackNumber || '-'}
                      </span>

                      {/* Title + format */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm truncate block ${
                          isSelected ? 'text-accent font-medium' : 'text-foreground'
                        }`}>
                          {track.title}
                        </span>
                        {track.fileFormat && (
                          <span className="text-[10px] text-foreground-tertiary font-mono uppercase tracking-wide">
                            {track.fileFormat}
                            {track.bitrate ? ` ${Math.round(track.bitrate / 1000)}k` : ''}
                          </span>
                        )}
                      </div>

                      {/* Duration */}
                      <span
                        className="text-right text-xs text-foreground-tertiary font-mono tabular-nums hidden sm:block"
                        style={{ width: '4rem' }}
                      >
                        {formatDuration(track.durationMs)}
                      </span>

                      {/* Lyrics indicator */}
                      <span className="flex justify-center" style={{ width: '1.5rem' }}>
                        {hasLyrics ? (
                          <MessageSquareText
                            className={`w-3.5 h-3.5 transition-colors ${
                              isSelected ? 'text-accent' : 'text-accent/40'
                            }`}
                          />
                        ) : (
                          <span className="w-3.5" />
                        )}
                      </span>
                    </motion.button>

                    {/* Inline Lyrics */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden border-b border-border-subtle"
                        >
                          <InlineLyrics trackId={track.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// -- Inline Lyrics Component --

interface LyricsResponse {
  plain: string | null;
  synced: string | null;
  cached: boolean;
}

function InlineLyrics({ trackId }: { trackId: string }) {
  const { data, isLoading } = useQuery<LyricsResponse>({
    queryKey: ['lyrics', trackId],
    queryFn: () => fetch(`/api/tracks/${trackId}/lyrics`).then((r) => r.json()),
    enabled: !!trackId,
  });

  const lyrics = data?.synced || data?.plain;

  return (
    <div
      className="relative"
      style={{
        padding: '1rem 1rem 1rem 0',
        marginLeft: '3px',
        background: 'rgba(232,168,73,0.02)',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: '2px',
          background: 'linear-gradient(to bottom, rgba(232,168,73,0.4) 0%, rgba(232,168,73,0.1) 100%)',
        }}
      />

      <div style={{ paddingLeft: '3.5rem' }}>
        {isLoading ? (
          <div className="flex items-center gap-2 py-3 text-foreground-tertiary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Loading lyrics...</span>
          </div>
        ) : lyrics ? (
          <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <pre className="text-xs text-foreground-secondary leading-relaxed whitespace-pre-wrap font-sans">
              {formatLyrics(lyrics)}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-foreground-tertiary py-2">
            No lyrics available for this track.
          </p>
        )}
      </div>
    </div>
  );
}

// -- Helpers --

function formatLyrics(text: string): string {
  return text.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s?/g, '').trim();
}

function groupByDisc(tracks: Track[]) {
  const groups = new Map<number, Track[]>();
  for (const track of tracks) {
    const disc = track.discNumber ?? 1;
    if (!groups.has(disc)) groups.set(disc, []);
    groups.get(disc)!.push(track);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([disc, discTracks]) => ({ disc, tracks: discTracks }));
}
