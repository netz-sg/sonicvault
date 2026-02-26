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
      <h2 className="font-heading text-xl text-foreground mb-4">
        Tracks
      </h2>

      <div className="rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle text-[11px] uppercase
                        tracking-wider text-foreground-tertiary font-medium">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Title</span>
          <span className="w-16 text-right hidden sm:block">Duration</span>
          <span className="w-6" />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          {grouped.map((group) => (
            <div key={group.disc}>
              {/* Disc header */}
              {hasMultipleDiscs && (
                <div className="px-4 py-2 bg-surface-tertiary/50 border-b border-border-subtle">
                  <span className="text-[11px] uppercase tracking-wider text-foreground-tertiary font-medium">
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
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150
                                  ${!isSelected ? 'border-b border-border-subtle' : ''}
                                  ${isSelected
                                    ? 'bg-accent/5 border-l-2 border-l-accent'
                                    : 'hover:bg-surface-tertiary/30 border-l-2 border-l-transparent'
                                  }`}
                    >
                      {/* Track number */}
                      <span className={`w-8 text-center text-xs font-mono tabular-nums shrink-0 ${
                        isSelected ? 'text-accent' : 'text-foreground-tertiary'
                      }`}>
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
                          <span className="text-[10px] text-foreground-tertiary uppercase">
                            {track.fileFormat}
                            {track.bitrate ? ` ${Math.round(track.bitrate / 1000)}k` : ''}
                          </span>
                        )}
                      </div>

                      {/* Duration */}
                      <span className="w-16 text-right text-xs text-foreground-tertiary font-mono tabular-nums hidden sm:block">
                        {formatDuration(track.durationMs)}
                      </span>

                      {/* Lyrics indicator */}
                      <span className="w-6 flex justify-center">
                        {hasLyrics ? (
                          <MessageSquareText className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-accent/60'}`} />
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

// ── Inline Lyrics Component ──

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
    <div className="bg-surface-tertiary/20 border-l-2 border-l-accent px-4 py-4 ml-0">
      <div className="pl-11">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-foreground-tertiary">
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

// ── Helpers ──

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
