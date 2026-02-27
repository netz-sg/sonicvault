'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Loader2, X } from 'lucide-react';

interface LyricsPanelProps {
  trackId: string | null;
  trackTitle: string;
  onClose: () => void;
}

interface LyricsResponse {
  plain: string | null;
  synced: string | null;
  cached: boolean;
}

export function LyricsPanel({ trackId, trackTitle, onClose }: LyricsPanelProps) {
  const { data, isLoading } = useQuery<LyricsResponse>({
    queryKey: ['lyrics', trackId],
    queryFn: () => fetch(`/api/tracks/${trackId}/lyrics`).then((r) => r.json()),
    enabled: !!trackId,
  });

  const lyrics = data?.synced || data?.plain;

  return (
    <AnimatePresence>
      {trackId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border-subtle overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b border-border-subtle"
            style={{ padding: '0.75rem 1rem' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquareText className="w-4 h-4 text-accent shrink-0" />
              <h3 className="text-sm font-medium text-foreground truncate">
                {trackTitle}
              </h3>
              {data?.cached && (
                <span
                  className="shrink-0 rounded text-[10px] font-mono text-foreground-tertiary"
                  style={{
                    padding: '0.1rem 0.4rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  cached
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg text-foreground-tertiary hover:text-foreground hover:bg-surface-tertiary transition-colors"
              style={{ padding: '0.375rem' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="relative" style={{ padding: '1.25rem' }}>
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: '3px',
                background: 'linear-gradient(to bottom, rgba(232,168,73,0.4) 0%, rgba(232,168,73,0.05) 100%)',
                borderRadius: '0 2px 2px 0',
              }}
            />

            {isLoading ? (
              <div
                className="flex items-center gap-2 justify-center text-foreground-tertiary"
                style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-accent/40" />
                <span className="text-sm">Fetching lyrics...</span>
              </div>
            ) : lyrics ? (
              <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                <pre className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap font-sans">
                  {formatLyrics(lyrics)}
                </pre>
              </div>
            ) : (
              <div
                className="text-center"
                style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
              >
                <div
                  className="mx-auto rounded-full flex items-center justify-center"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'rgba(232,168,73,0.06)',
                    border: '1px solid rgba(232,168,73,0.08)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <MessageSquareText className="w-4 h-4 text-accent/25" />
                </div>
                <p className="text-sm text-foreground-tertiary">
                  No lyrics available for this track.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Strip LRC timestamps from synced lyrics for plain display */
function formatLyrics(text: string): string {
  return text.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s?/g, '').trim();
}
